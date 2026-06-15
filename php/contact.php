<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$allowedOrigin = rtrim($_ENV['FRONTEND_ORIGIN'] ?? 'http://127.0.0.1:5000', '/');
$requestOrigin = rtrim($_SERVER['HTTP_ORIGIN'] ?? '', '/');

if ($requestOrigin !== '' && hash_equals($allowedOrigin, $requestOrigin)) {
    header("Access-Control-Allow-Origin: {$requestOrigin}");
    header('Vary: Origin');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if ($requestOrigin !== '' && !hash_equals($allowedOrigin, $requestOrigin)) {
        respond(403, ['success' => false, 'message' => 'This origin is not allowed.']);
    }
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST, OPTIONS');
    respond(405, ['success' => false, 'message' => 'Only POST requests are accepted.']);
}

if ($requestOrigin !== '' && !hash_equals($allowedOrigin, $requestOrigin)) {
    respond(403, ['success' => false, 'message' => 'This origin is not allowed.']);
}

$maxRequestBytes = 16 * 1024;
$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > $maxRequestBytes) {
    respond(413, ['success' => false, 'message' => 'The message is too large.']);
}

$rawBody = file_get_contents('php://input', false, null, 0, $maxRequestBytes + 1);
if ($rawBody === false || strlen($rawBody) > $maxRequestBytes) {
    respond(413, ['success' => false, 'message' => 'The message is too large.']);
}

try {
    $data = json_decode($rawBody, true, 16, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    respond(400, ['success' => false, 'message' => 'Invalid JSON request.']);
}

if (!is_array($data)) {
    respond(400, ['success' => false, 'message' => 'Invalid request body.']);
}

if (trim((string) ($data['website'] ?? '')) !== '') {
    respond(200, ['success' => true, 'message' => 'Thanks. Your message has been sent.']);
}

$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$subject = trim((string) ($data['subject'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));
$errors = [];

if ($name === '' || mb_strlen($name) < 2 || mb_strlen($name) > 80) {
    $errors['name'] = 'Enter a name between 2 and 80 characters.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 160) {
    $errors['email'] = 'Enter a valid email address.';
}
if ($subject === '' || mb_strlen($subject) < 3 || mb_strlen($subject) > 140) {
    $errors['subject'] = 'Enter a subject between 3 and 140 characters.';
}
if ($message === '' || mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
    $errors['message'] = 'Enter a message between 10 and 5000 characters.';
}

if ($errors !== []) {
    respond(422, [
        'success' => false,
        'message' => 'Please correct the highlighted fields.',
        'errors' => $errors,
    ]);
}

$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitSeconds = max(10, (int) ($_ENV['RATE_LIMIT_SECONDS'] ?? 60));
$rateFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'fusiontech-contact-' . hash('sha256', $clientIp);
$lastRequest = is_file($rateFile) ? (int) file_get_contents($rateFile) : 0;

if ($lastRequest > 0 && time() - $lastRequest < $rateLimitSeconds) {
    respond(429, [
        'success' => false,
        'message' => "Please wait {$rateLimitSeconds} seconds before sending another message.",
    ]);
}

$smtpUser = trim($_ENV['SMTP_USERNAME'] ?? '');
$smtpPassword = trim($_ENV['SMTP_APP_PASSWORD'] ?? '');
$recipient = trim($_ENV['CONTACT_RECIPIENT'] ?? 'ch.fahadrazzaq22@gmail.com');

if ($smtpUser === '' || $smtpPassword === '' || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    error_log('FusionTECH contact service is missing valid SMTP configuration.');
    respond(503, [
        'success' => false,
        'message' => 'Email delivery is not configured yet. Please email us directly.',
    ]);
}

$safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeSubject = htmlspecialchars($subject, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPassword;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = (int) ($_ENV['SMTP_PORT'] ?? 587);
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->Timeout = 15;

    $mail->setFrom($smtpUser, 'FusionTECH Website');
    $mail->addAddress($recipient);
    $mail->addReplyTo($email, $name);
    $mail->isHTML(true);
    $mail->Subject = "[FusionTECH] {$subject}";
    $mail->Body = "
        <h2>New FusionTECH website inquiry</h2>
        <p><strong>Name:</strong> {$safeName}</p>
        <p><strong>Email:</strong> {$safeEmail}</p>
        <p><strong>Subject:</strong> {$safeSubject}</p>
        <p><strong>Message:</strong></p>
        <p>{$safeMessage}</p>
    ";
    $mail->AltBody = "New FusionTECH website inquiry\n\nName: {$name}\nEmail: {$email}\nSubject: {$subject}\n\n{$message}";
    $mail->send();

    file_put_contents($rateFile, (string) time(), LOCK_EX);
    respond(200, ['success' => true, 'message' => 'Thanks. Your message has been sent successfully.']);
} catch (MailException $exception) {
    error_log('FusionTECH mail delivery failed: ' . $exception->getMessage());
    respond(502, [
        'success' => false,
        'message' => 'Email delivery failed. Please try again or email us directly.',
    ]);
}
