# FusionTECH Website

An animated multi-page aerospace and embedded-systems company website using Flask for the frontend and PHP/PHPMailer for contact email delivery.

## Prerequisites

- Python 3.11 or newer, available through `py`
- PHP 8.1 or newer with the `mbstring` extension enabled
- Composer
- A Gmail account with two-step verification and a Google app password

On Windows, install PHP and Composer and ensure both `php` and `composer` work in a new PowerShell window.

## Configure Gmail

1. Copy `php/.env.example` to `php/.env`. The launcher does this automatically the first time.
2. Set `SMTP_USERNAME` to the Gmail account used to send messages.
3. Set `SMTP_APP_PASSWORD` to a Google app password, not the normal Gmail password.
4. Leave `CONTACT_RECIPIENT=ch.fahadrazzaq22@gmail.com` to receive website inquiries there.

The `.env` file and Composer dependencies are ignored by Git.

## Run locally

From PowerShell in this folder:

```powershell
.\start.ps1
```

The launcher installs dependencies, checks ports, starts both services, opens the browser, and keeps running until `Ctrl+C`.

- Website: http://127.0.0.1:5000
- Contact API: http://127.0.0.1:8081/contact.php

To skip opening a browser:

```powershell
.\start.ps1 -NoBrowser
```

## Manual startup

```powershell
py -m pip install -r requirements.txt
cd php
composer install
php -S 127.0.0.1:8081
```

In a second PowerShell window:

```powershell
py -m flask --app app.py run --host 127.0.0.1 --port 5000 --debug
```

## Contact API

The endpoint accepts JSON with `name`, `email`, `subject`, `message`, and the hidden `website` spam field. It returns JSON and uses HTTP `422` for validation errors, `429` for rate limiting, and `502` or `503` when mail delivery is unavailable.
