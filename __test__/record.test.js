import record from "../src/record";

test("", async () => {
  const records1 = [{ contentId: "sm100" }, { contentId: "sm99" }, { contentId: "sm98" }];
  const records2 = [{ contentId: "sm103" }, { contentId: "sm102" }, { contentId: "sm101" }];

  const mergedRecords = record.mergeRecords(records1, records2);

  expect(records1.length).toEqual(3);
  expect(records2.length).toEqual(3);
  expect(mergedRecords.length).toEqual(6);
  expect(mergedRecords[0].contentId).toEqual("sm103");
});

test("", async () => {
  const records1 = [{ contentId: "sm100" }, { contentId: "sm99" }, { contentId: "sm98" }];
  const records2 = [{ contentId: "sm102" }, { contentId: "sm101" }, { contentId: "sm100" }];

  const mergedRecords = record.mergeRecords(records1, records2);

  expect(records1.length).toEqual(3);
  expect(records2.length).toEqual(3);
  expect(mergedRecords.length).toEqual(5);
  expect(mergedRecords[0].contentId).toEqual("sm102");
});

test("", async () => {
  const records1 = [{ contentId: "sm100" }, { contentId: "sm99" }, { contentId: "sm98" }];
  const records2 = [{ contentId: "sm10" }, { contentId: "sm9" }, { contentId: "sm8" }];

  const mergedRecords = record.mergeRecords(records1, records2);

  expect(records1.length).toEqual(3);
  expect(records2.length).toEqual(3);
  expect(mergedRecords.length).toEqual(3);
  expect(mergedRecords[0].contentId).toEqual("sm100");
});

test("", async () => {
  const records1 = [];
  const records2 = [{ contentId: "sm10" }, { contentId: "sm9" }, { contentId: "sm8" }];

  const mergedRecords = record.mergeRecords(records1, records2);

  expect(records1.length).toEqual(0);
  expect(records2.length).toEqual(3);
  expect(mergedRecords.length).toEqual(3);
  expect(mergedRecords[0].contentId).toEqual("sm10");
});

test("", async () => {
  const records1 = [{ contentId: "sm100" }, { contentId: "sm99" }, { contentId: "sm98" }];
  const records2 = [];

  const mergedRecords = record.mergeRecords(records1, records2);

  expect(records1.length).toEqual(3);
  expect(records2.length).toEqual(0);
  expect(mergedRecords.length).toEqual(3);
  expect(mergedRecords[0].contentId).toEqual("sm100");
});
