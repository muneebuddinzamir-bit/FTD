"""FusionTECH Flask application."""

from datetime import datetime
from pathlib import Path

from flask import Flask, render_template


BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)


@app.context_processor
def inject_globals():
    return {"current_year": datetime.now().year}


@app.get("/")
def home():
    return render_template("index.html", active_page="home")


@app.get("/about")
def about():
    return render_template("about.html", active_page="about")


@app.get("/services")
def services():
    return render_template("service.html", active_page="services")


@app.get("/projects")
def projects():
    return render_template("project.html", active_page="projects")


@app.get("/blog")
def blog():
    return render_template("blog.html", active_page="blog")


@app.get("/contact")
def contact():
    return render_template("contact.html", active_page="contact")


@app.errorhandler(404)
def not_found(_error):
    return render_template("404.html", active_page=None), 404


@app.errorhandler(500)
def server_error(_error):
    return render_template("500.html", active_page=None), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
