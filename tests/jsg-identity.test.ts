import assert from "node:assert/strict";
import test from "node:test";
import { getInitialNotificationPreference } from "../src/lib/jsg-identity";

test("keeps the administrator identity and notification emails separate", () => {
  assert.deepEqual(
    getInitialNotificationPreference("JSGuzmanB@gmail.com", {
      adminEmail: "jsguzmanb@gmail.com",
      adminNotificationEmail: "juans.guzman@valentechforlife.com",
      adminTimeZone: "America/Bogota",
    }),
    {
      notificationEmail: "juans.guzman@valentechforlife.com",
      timeZone: "America/Bogota",
    },
  );
});

test("uses the identity email and UTC for other users", () => {
  assert.deepEqual(
    getInitialNotificationPreference("Member@Example.com", {
      adminEmail: "jsguzmanb@gmail.com",
      adminNotificationEmail: "juans.guzman@valentechforlife.com",
      adminTimeZone: "America/Bogota",
    }),
    {
      notificationEmail: "member@example.com",
      timeZone: "UTC",
    },
  );
});
