import unittest

from app import app


class FusionTechAppTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_all_public_pages_render(self):
        for path in ("/", "/about", "/services", "/projects", "/blog", "/contact"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertIn(b"FusionTECH", response.data)

    def test_home_uses_company_assets_and_aerospace_content(self):
        response = self.client.get("/")
        self.assertIn(b"/static/img/hero.png", response.data)
        self.assertIn(b"/static/img/log.png", response.data)
        self.assertIn(b"UAV Design", response.data)
        self.assertIn(b"Real-Time Embedded Systems", response.data)
        self.assertIn(b"data-live-clock", response.data)
        self.assertIn(b"Illustrative real-time interface", response.data)

    def test_contact_page_contains_php_endpoint_and_fields(self):
        response = self.client.get("/contact")
        self.assertIn(b"http://127.0.0.1:8081/contact.php", response.data)
        for field in (b'name="name"', b'name="email"', b'name="subject"', b'name="message"'):
            self.assertIn(field, response.data)

    def test_unknown_route_uses_custom_404(self):
        response = self.client.get("/not-a-real-page")
        self.assertEqual(response.status_code, 404)
        self.assertIn(b"This page took a wrong turn.", response.data)


if __name__ == "__main__":
    unittest.main()
