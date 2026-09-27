import { describe, expect, it } from "vitest";

import { catalogueVehicle, hasModel, makeOptions, modelOptions } from "./catalog";

describe("the vehicle catalogue in the forms", () => {
  it("offers the makes, and keeps an old car's own spelling selectable", () => {
    expect(makeOptions("")).toContain("Audi");
    expect(makeOptions("Москвич Custom")[0]).toBe("Москвич Custom");
  });

  it("knows the models the test report found missing", () => {
    expect(hasModel("Audi", "S5")).toBe(true);
    expect(modelOptions("Audi", "")).toContain("A6");
  });

  it("names a scanned make and model the catalogue's way, or not at all", () => {
    expect(catalogueVehicle("AUDI", "A6")).toEqual({ brand: "Audi", model: "A6" });
    expect(catalogueVehicle("Непозната", "Х")).toEqual({ brand: "", model: "" });
  });
});
