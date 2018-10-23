const replace = (sourceText, patterns, fn) => {
  let builtText = "";
  let currentIndex = 0;
  const lowerSourceText = sourceText.toLowerCase();

  for (;;) {
    let found = false;
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i].trim();
      if (!pattern) {
        break;
      }
      const foundIndex = lowerSourceText.indexOf(pattern.toLowerCase(), currentIndex);
      if (foundIndex >= 0) {
        found = true;
        builtText += sourceText.substring(currentIndex, foundIndex);
        builtText += fn(sourceText.substring(foundIndex, foundIndex + pattern.length));
        currentIndex = foundIndex + pattern.length;
        break;
      }
    }
    if (!found) {
      builtText += sourceText.substring(currentIndex);
      break;
    }
  }
  return builtText;
};

const pad = num => {
  return num.toString().padStart(2, 0);
};

export default {
  replace: replace,
  format(aDate) {
    const year = aDate.getFullYear().toString();
    const month = pad(aDate.getMonth());
    const date = pad(aDate.getDate());
    const h = pad(aDate.getHours());
    const m = pad(aDate.getMinutes());
    const s = pad(aDate.getSeconds());
    return `${year}/${month}/${date} ${h}:${m}:${s}`;
  },
  convertContentIdToNumber(contentId) {
    let r = 0;
    if (contentId.startsWith("sm")) {
      r = parseInt(contentId.substring(2), 10);
    }
    return r;
  }
};
