import text from "../src/text.js";

test("", async () => {
  expect(text.replace("あいうえお", ["ああ"], t => "<span>" + t + "</span>")).toEqual("あいうえお");
  expect(text.replace("あいうえお", ["あ"], t => "<span>" + t + "</span>")).toEqual("<span>あ</span>いうえお");
  expect(text.replace("あいうえお", ["ああ"], t => "<span>" + t + "</span>")).toEqual("あいうえお");

  expect(text.replace("いいいああいいいああいいい", ["ああ"], t => "<span>" + t + "</span>")).toEqual(
    "いいい<span>ああ</span>いいい<span>ああ</span>いいい"
  );

  expect(text.replace("あいうえお", ["あい", "いう", "うえ"], t => "<span>" + t + "</span>")).toEqual("<span>あい</span><span>うえ</span>お");

  expect(text.replace("abc", ["a", "a", "a"], t => "<span>" + t + "</span>")).toEqual("<span>a</span>bc");
  expect(text.replace("abcabc", ["a"], t => "<span>" + t + "</span>")).toEqual("<span>a</span>bc<span>a</span>bc");

  expect(text.replace("abcabcabcabcabcabc", ["a", "a", "a"], t => "<span>" + t + "</span>")).toEqual(
    "<span>a</span>bc<span>a</span>bc<span>a</span>bc<span>a</span>bc<span>a</span>bc<span>a</span>bc"
  );
});
