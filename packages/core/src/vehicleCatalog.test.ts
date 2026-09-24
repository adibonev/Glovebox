import { describe, expect, it } from "vitest";

import {
  makeNames,
  matchMake,
  matchModel,
  modelsFor,
  vehicleYears,
  type VehicleCatalog,
} from "./vehicleCatalog";
import { VEHICLE_CATALOG } from "./vehicleCatalog.data";

// A stand-in for the shipped catalogue: the behaviour is what is tested, not the data.
const CATALOG: VehicleCatalog = [
  { make: "Audi", models: ["A4", "A6", "Q5"] },
  { make: "Škoda", models: ["Octavia", "Fabia"] },
];

describe("makeNames", () => {
  it("lists the makes in the order the catalogue gives them", () => {
    expect(makeNames(CATALOG)).toEqual(["Audi", "Škoda"]);
  });
});

describe("modelsFor", () => {
  it("lists the models of one make", () => {
    expect(modelsFor(CATALOG, "Audi")).toEqual(["A4", "A6", "Q5"]);
  });

  it("has nothing for a make outside the catalogue", () => {
    expect(modelsFor(CATALOG, "DeLorean")).toEqual([]);
  });
});

describe("matchMake", () => {
  it("recognises the make a certificate spells in Cyrillic", () => {
    // Every certificate prints the make in Cyrillic, and a scan has to land on a real entry
    // or the User is left picking it from the list by hand.
    expect(matchMake(CATALOG, "АУДИ")).toBe("Audi");
  });
});

describe("matchModel", () => {
  it("recognises a model however the certificate spaces it", () => {
    // The certificate prints "A 6"; the catalogue calls it "A6".
    expect(matchModel(CATALOG, "Audi", "A 6")).toBe("A6");
  });

  it("recognises a model whatever case it is written in", () => {
    expect(matchModel(CATALOG, "Škoda", "OCTAVIA")).toBe("Octavia");
  });

  it("gives nothing for a model the make does not have", () => {
    expect(matchModel(CATALOG, "Audi", "Octavia")).toBeNull();
  });
});

describe("vehicleYears", () => {
  it("offers next year first, for a car registered ahead of the calendar", () => {
    expect(vehicleYears(new Date("2026-09-24"))[0]).toBe(2027);
  });

  it("goes back far enough for a Moskvich", () => {
    const years = vehicleYears(new Date("2026-09-24"));

    expect(years[years.length - 1]).toBe(1960);
  });
});

describe("the shipped catalogue", () => {
  it("carries the makes Bulgarian drivers actually own", () => {
    const makes = makeNames(VEHICLE_CATALOG);

    expect(makes).toEqual(expect.arrayContaining(["Volkswagen", "Opel", "Škoda", "Dacia", "Lada"]));
  });

  it("knows the models of a make down to the ones on Bulgarian roads", () => {
    expect(modelsFor(VEHICLE_CATALOG, "Opel")).toEqual(expect.arrayContaining(["Astra", "Corsa", "Vectra"]));
  });

  it("matches what a scanned certificate says against it", () => {
    // "АУДИ" and "A 6" are exactly what the reader hands back for the certificate we tested with.
    expect(matchMake(VEHICLE_CATALOG, "АУДИ")).toBe("Audi");
    expect(matchModel(VEHICLE_CATALOG, "Audi", "A 6")).toBe("A6");
  });
});
