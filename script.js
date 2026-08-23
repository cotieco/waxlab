(function () {
  "use strict";

  var GOLD = "#d9a441";
  var NAVY = "#2e3b80";

  /* ================= Spec icons ================= */

  function iconSVG(type) {
    if (type === "clean") {
      // water drop (slightly smaller, thin outline) + a bold gold sparkle.
      return (
        '<svg viewBox="0 0 24 28" fill="none" role="presentation" aria-hidden="true">' +
        '<path d="M12 3.4 C12 3.4 5 12.2 5 17.5 a7 7 0 0 0 14 0 C19 12.2 12 3.4 12 3.4 Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M17.5 2.6 L18.7 5.3 21.4 6.5 18.7 7.7 17.5 10.4 16.3 7.7 13.6 6.5 16.3 5.3 Z" fill="' + GOLD + '"/>' +
        "</svg>"
      );
    }
    // lightning bolt — gold fill with a darker navy outline.
    return (
      '<svg viewBox="0 0 24 28" fill="none" role="presentation" aria-hidden="true">' +
      '<path d="M13 1 L4 14 h6 l-1 9 9-13 h-6 l1-9 Z" fill="' + GOLD + '" stroke="' + NAVY + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  function mountDecor() {
    Array.prototype.forEach.call(document.querySelectorAll(".spec-icon[data-icon]"), function (el) {
      el.innerHTML = iconSVG(el.getAttribute("data-icon"));
    });
  }

  /* ================= Booking ================= */
  var form = document.getElementById("bookingForm");
  var nameInput = document.getElementById("custName");
  var dateInput = document.getElementById("custDate");
  var serviceSelect = document.getElementById("serviceSelect");
  var statusEl = document.getElementById("formStatus");
  var phoneInput = document.getElementById("custPhone");
  var emailInput = document.getElementById("custEmail");
  var noteInput = document.getElementById("custNote");
  var dropMsg = document.getElementById("dropMsg");

  dateInput.min = new Date().toISOString().split("T")[0];

  /* ================= Plan picker ================= */
  var plans = Array.prototype.slice.call(document.querySelectorAll(".plan"));
  var includeItems = Array.prototype.slice.call(document.querySelectorAll(".include-list li"));

  function applyPlan(planBtn) {
    plans.forEach(function (b) { b.classList.toggle("active", b === planBtn); });
    var covered = (planBtn.dataset.items || "").split(",");
    includeItems.forEach(function (li) {
      li.classList.toggle("checked", covered.indexOf(li.dataset.item) !== -1);
    });
    if (serviceSelect) serviceSelect.value = planBtn.dataset.service;
  }

  plans.forEach(function (btn) {
    btn.addEventListener("click", function () { applyPlan(btn); });
  });
  if (plans.length) applyPlan(plans[0]);

  /* ================= Contact & location toggles ================= */
  var contactBtns = Array.prototype.slice.call(document.querySelectorAll(".pref-btn[data-pref]"));
  var locBtns = Array.prototype.slice.call(document.querySelectorAll(".pref-btn[data-loc]"));
  var dateWrap = document.getElementById("dateWrap");
  var currentContact = "text";
  var currentLocation = "louisville";

  function setContact(pref) {
    currentContact = pref;
    contactBtns.forEach(function (b) { b.classList.toggle("active", b.dataset.pref === pref); });
    var showPhone = pref === "text";
    phoneInput.classList.toggle("hidden", !showPhone);
    emailInput.classList.toggle("hidden", showPhone);
    try { localStorage.setItem("waxlab-contact", pref); } catch (e) {}
  }

  contactBtns.forEach(function (btn) {
    btn.addEventListener("click", function () { setContact(btn.dataset.pref); });
  });

  function setLocation(loc) {
    currentLocation = loc;
    locBtns.forEach(function (b) { b.classList.toggle("active", b.dataset.loc === loc); });
    dateWrap.classList.toggle("hidden", loc !== "louisville");
  }

  locBtns.forEach(function (btn) {
    btn.addEventListener("click", function () { setLocation(btn.dataset.loc); });
  });

  var storedContact = null;
  try { storedContact = localStorage.getItem("waxlab-contact"); } catch (e) {}
  setContact(storedContact === "email" ? "email" : "text");
  setLocation("louisville");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    var date = dateInput.value;
    var contact = currentContact === "email" ? emailInput.value.trim() : phoneInput.value.trim();
    var ok = true;

    nameInput.classList.toggle("invalid", !name);
    phoneInput.classList.toggle("invalid", currentContact === "text" && !contact);
    emailInput.classList.toggle("invalid", currentContact === "email" && !contact);
    dateInput.classList.toggle("invalid", currentLocation === "louisville" && !date);

    var msg = "";
    var oops = "";
    if (!name) { ok = false; msg = "Please enter your name."; }
    else if (!contact) { ok = false; msg = "Please enter your " + currentContact + " address."; }
    else if (currentContact === "text" && contact.replace(/\D/g, "").length < 10) {
      ok = false;
      oops = "Oops! Please enter a valid phone number with at least 10 digits. Please try again.";
    }
    else if (currentContact === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      ok = false;
      oops = "Oops! That doesn't look like a valid email address. Please try again.";
    }
    else if (currentLocation === "louisville" && !date) { ok = false; msg = "Please pick a preferred date."; }
    else if (currentLocation === "louisville" && date < dateInput.min) { ok = false; msg = "Please pick today or a later date."; }

    statusEl.className = "form-status" + (ok ? " ok" : " err");
    if (!ok) {
      if (oops) {
        dropMsg.classList.remove("hidden");
        dropMsg.classList.add("err");
        dropMsg.textContent = oops;
        statusEl.textContent = "";
      } else {
        dropMsg.classList.add("hidden");
        statusEl.textContent = msg;
      }
      return;
    }

    var word = currentContact === "email" ? "email" : "text";
    var confirmText = currentLocation === "boulder"
      ? "Great! We are in Boulder at least twice a week and will " + word + " you to arrange a drop-off, usually before or after a group ride."
      : "Great! We will " + word + " you within one working day to confirm the date, time and address for your drop-off. Thank you!";

    statusEl.className = "form-status";
    statusEl.textContent = "Sending your booking…";

    sendBookingEmail({
      to_email: "waxlabcolorado@gmail.com",
      service: serviceSelect.value,
      name: name,
      contact_pref: currentContact,
      contact_value: contact,
      location: currentLocation === "boulder" ? "Boulder" : "Louisville",
      preferred_date: date,
      note: noteInput.value.trim()
    }).then(function () {
      dropMsg.classList.remove("hidden", "err");
      dropMsg.textContent = confirmText;
      statusEl.className = "form-status";
      statusEl.textContent = "";
      form.reset();
      setContact(currentContact);
      setLocation(currentLocation);
      dateInput.min = new Date().toISOString().split("T")[0];
    }).catch(function (err) {
      dropMsg.classList.remove("hidden");
      dropMsg.classList.add("err");
      dropMsg.textContent = "Oops! We couldn't send your booking — please try again.";
      statusEl.className = "form-status err";
      statusEl.textContent = "";
      if (window.console) console.error("EmailJS error:", err);
    });
  });

  /* ================= EmailJS config =================
     Set these three from your EmailJS dashboard:
       Public key -> Account > General
       Service ID  -> Email Services (the Gmail connection)
       Template ID -> Email Templates (create one that sends to waxlabcolorado@gmail.com
       and uses the params: name, service, contact_pref, contact_value, location, preferred_date, note)
  ==================================================== */
  var EMAILJS_PUBLIC_KEY = "xyqrGi8m8eLCj7jvz";
  var EMAILJS_SERVICE_ID = "service_j671dne";
  var EMAILJS_TEMPLATE_ID = "template_i8h7qyp";

  function sendBookingEmail(data) {
    if (typeof emailjs === "undefined") {
      return Promise.reject(new Error("EmailJS SDK not loaded"));
    }
    if (EMAILJS_PUBLIC_KEY.indexOf("YOUR_") === 0) {
      return Promise.reject(new Error("EmailJS not configured"));
    }
    emailjs.init(EMAILJS_PUBLIC_KEY);
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, data);
  }

  /* ================= Init ================= */
  mountDecor();
})();