test("", async () => {
  replace("あいうえお", ["あ"], t => "<span>" + t + "</span>");

  expect(replace("あいうえお", ["ああ"], t => "<span>" + t + "</span>")).toEqual("あいうえお");
  expect(replace("あいうえお", ["あ"], t => "<span>" + t + "</span>")).toEqual("<span>あ</span>いうえお");
  expect(replace("あいうえお", ["ああ"], t => "<span>" + t + "</span>")).toEqual("あいうえお");

  expect(replace("いいいああいいいああいいい", ["ああ"], t => "<span>" + t + "</span>")).toEqual(
    "いいい<span>ああ</span>いいい<span>ああ</span>いいい"
  );

  expect(replace("あいうえお", ["あい", "いう", "うえ"], t => "<span>" + t + "</span>")).toEqual(
    "<span>あい</span><span>うえ</span>お"
  );

  expect(replace("abc", ["a", "a", "a"], t => "<span>" + t + "</span>")).toEqual("<span>a</span>bc");
  expect(replace("abcabc", ["a"], t => "<span>" + t + "</span>")).toEqual("<span>a</span>bc<span>a</span>bc");

  expect(replace("abcabcabcabcabcabc", ["a", "a", "a"], t => "<span>" + t + "</span>")).toEqual(
    "<span>a</span>bc<span>a</span>bc<span>a</span>bc<span>a</span>bc<span>a</span>bc<span>a</span>bc"
  );
});
