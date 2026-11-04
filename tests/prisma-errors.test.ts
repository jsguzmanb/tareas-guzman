import assert from "node:assert/strict";
import test from "node:test";
import { isConsumedAccessTokenConflict } from "../src/lib/prisma-errors";

test("recognizes a consumed jti conflict when Prisma only reports the model", () => {
  assert.equal(
    isConsumedAccessTokenConflict({
      code: "P2002",
      meta: { modelName: "ConsumedAccessToken" },
    }),
    true,
  );
});

test("does not classify another model's unique conflict as a used link", () => {
  assert.equal(
    isConsumedAccessTokenConflict({
      code: "P2002",
      meta: { modelName: "User" },
    }),
    false,
  );
});
