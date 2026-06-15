(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  let lastScrollY = window.scrollY;

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.classList.remove("open");
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    document.body.classList.remove("menu-open");
  };

  menuButton?.addEventListener("click", () => {
    const willOpen = !navigation.classList.contains("open");
    menuButton.classList.toggle("open", willOpen);
    navigation.classList.toggle("open", willOpen);
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("menu-open", willOpen);
  });

  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });

  window.addEventListener("scroll", () => {
    const currentY = window.scrollY;
    header?.classList.toggle("scrolled", currentY > 20);
    header?.classList.toggle("header-hidden", currentY > lastScrollY && currentY > 180 && !navigation?.classList.contains("open"));
    lastScrollY = currentY;
  }, { passive: true });

  const revealItems = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      revealObserver.observe(item);
    });
  }

  const typeTarget = document.querySelector("[data-typewriter]");
  if (typeTarget && !reducedMotion) {
    const words = JSON.parse(typeTarget.dataset.words || "[]");
    let wordIndex = 0;
    let characterIndex = words[0]?.length || 0;
    let deleting = true;

    const type = () => {
      const word = words[wordIndex] || "";
      characterIndex += deleting ? -1 : 1;
      typeTarget.textContent = word.slice(0, characterIndex);
      let delay = deleting ? 55 : 90;

      if (!deleting && characterIndex === word.length) {
        deleting = true;
        delay = 1300;
      } else if (deleting && characterIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 250;
      }
      window.setTimeout(type, delay);
    };
    window.setTimeout(type, 1200);
  }

  const counters = document.querySelectorAll("[data-counter]");
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.counter);
    const suffix = counter.dataset.suffix || "";
    const started = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (reducedMotion) {
    counters.forEach((counter) => {
      counter.textContent = `${counter.dataset.counter}${counter.dataset.suffix || ""}`;
    });
  } else if (counters.length) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.65 });
    counters.forEach((counter) => counterObserver.observe(counter));
  }

  const liveClock = document.querySelector("[data-live-clock]");
  const liveDate = document.querySelector("[data-live-date]");
  const telemetryLink = document.querySelector("[data-telemetry='link']");
  const telemetryAltitude = document.querySelector("[data-telemetry='altitude']");
  const telemetryLatency = document.querySelector("[data-telemetry='latency']");

  if (liveClock && liveDate) {
    const updateClock = () => {
      const now = new Date();
      liveClock.textContent = new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(now);
      liveDate.textContent = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(now);
    };
    updateClock();
    window.setInterval(updateClock, 1000);
  }

  if (telemetryLink && telemetryAltitude && telemetryLatency && !reducedMotion) {
    window.setInterval(() => {
      telemetryLink.textContent = `${(98.1 + Math.random() * 1.4).toFixed(1)}%`;
      telemetryAltitude.textContent = `${Math.round(1235 + Math.random() * 18).toLocaleString()} m`;
      telemetryLatency.textContent = `${Math.round(16 + Math.random() * 6)} ms`;
    }, 1800);
  }

  const tiltArea = document.querySelector("[data-tilt]");
  const tiltCard = tiltArea?.querySelector(".code-window");
  if (tiltArea && tiltCard && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    tiltArea.addEventListener("mousemove", (event) => {
      const rect = tiltArea.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    tiltArea.addEventListener("mouseleave", () => {
      tiltCard.style.transform = "rotateY(0) rotateX(0)";
    });
  }

  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = document.querySelector("#form-status");
  const submitButton = form.querySelector("button[type='submit']");
  const submitLabel = submitButton.querySelector("span");

  const clearErrors = () => {
    form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
    form.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
    status.textContent = "";
    status.className = "form-status";
  };

  const showErrors = (errors = {}) => {
    Object.entries(errors).forEach(([name, message]) => {
      const field = form.elements.namedItem(name);
      const error = form.querySelector(`[data-error-for="${name}"]`);
      field?.setAttribute("aria-invalid", "true");
      if (error) error.textContent = message;
    });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitButton.disabled = true;
    submitLabel.textContent = "Sending...";

    try {
      const response = await fetch(form.dataset.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        showErrors(data.errors);
        throw new Error(data.message || "We could not send your message. Please try again.");
      }

      form.reset();
      status.textContent = data.message || "Thanks. Your message has been sent.";
      status.classList.add("success");
    } catch (error) {
      status.textContent = error.message === "Failed to fetch"
        ? "The local mail service is unavailable. Start the PHP server and try again."
        : error.message;
      status.classList.add("error");
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = "Send message";
    }
  });
})();
