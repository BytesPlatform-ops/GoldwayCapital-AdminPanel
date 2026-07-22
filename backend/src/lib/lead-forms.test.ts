import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTaskDescription } from "./lead-forms";

test("medicare: renders contact block + vertical fields + closing, in order", () => {
  const out = buildTaskDescription("MEDICARE", {
    formName: "Medicare Consultation Request",
    phone: "555-1000",
    email: "jane@example.com",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    values: {
      county: "Travis",
      turning65: "Yes",
      currentlyEnrolledMedicare: "No",
      medicareHelpWith: "Plan comparison",
      medicareBiggestQuestion: "Which plan fits?",
      bestTimeToCall: "Mornings",
    },
  });
  assert.equal(
    out,
    [
      "New Medicare Consultation Request submission.",
      "",
      "Phone: 555-1000",
      "Email: jane@example.com",
      "Location: Austin, TX 78701",
      "",
      "County: Travis",
      "Turning 65: Yes",
      "Currently enrolled in Medicare: No",
      "Needs help with: Plan comparison",
      "Biggest question: Which plan fits?",
      "Best time to call: Mornings",
      "",
      "Reach out using the preferred method during the selected time window.",
    ].join("\n")
  );
});

test("empty/missing fields are skipped — no blank lines", () => {
  const out = buildTaskDescription("FINAL_EXPENSE", {
    formName: "Final Expense Inquiry",
    phone: "555-2000",
    email: null,
    city: "",
    state: "",
    zipCode: "",
    values: { ageRange: "60-65", finalExpenseCoverage: "No", finalExpenseMostImportant: "", bestTimeToCall: undefined },
  });
  assert.equal(
    out,
    [
      "New Final Expense Inquiry submission.",
      "",
      "Phone: 555-2000",
      "",
      "Age range: 60-65",
      "Has current coverage: No",
      "",
      "Reach out using the preferred method during the selected time window.",
    ].join("\n")
  );
  assert.ok(!out.includes("\n\n\n"), "no triple newline / blank line");
});

test("contact: message renders in its own block; arrays join with comma", () => {
  const out = buildTaskDescription("CONTACT", {
    formName: "Contact Form",
    phone: "555-3000",
    email: "bob@example.com",
    values: {
      serviceInterest: "Medicare Solutions",
      preferredContactMethod: "Email",
      bestTimeToContact: "Afternoon",
      message: "Please call me back about my options.",
    },
  });
  assert.match(out, /Service interest: Medicare Solutions/);
  assert.match(out, /Best time to contact: Afternoon/);
  assert.match(out, /Message\/Notes: Please call me back about my options\./);
});

test("recruiting: array-valued licensed lines render comma-joined", () => {
  const out = buildTaskDescription("RECRUITING", {
    formName: "Medicare Agent Opportunities",
    phone: "555-4000",
    values: { stateOfResidence: "TX", insuranceLicense: "Yes", licensedLines: ["Life", "Health"] },
  });
  assert.match(out, /Licensed lines: Life, Health/);
});
