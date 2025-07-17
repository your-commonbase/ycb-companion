// Test script for sentence splitting function
const testText =
  "Woman's Working Band House is a historic house in Tallahassee, Leon County, Florida.It is located at 648 W.Brevard St.in Frenchtown, the oldest surviving African-American community in Florida.";

const splitIntoSentences = (text) => {
  // Common abbreviations that shouldn't end sentences
  const abbreviations = [
    'Mr.',
    'Mrs.',
    'Ms.',
    'Dr.',
    'Prof.',
    'Sr.',
    'Jr.',
    'St.',
    'Ave.',
    'Rd.',
    'Blvd.',
    'Ct.',
    'Ln.',
    'Pl.',
    'N.',
    'S.',
    'E.',
    'W.',
    'NE.',
    'NW.',
    'SE.',
    'SW.',
    'U.S.',
    'U.K.',
    'Inc.',
    'Ltd.',
    'Corp.',
    'Co.',
    'etc.',
    'vs.',
    'i.e.',
    'e.g.',
    'a.m.',
    'p.m.',
    'A.M.',
    'P.M.',
    'B.C.',
    'A.D.',
    'Ph.D.',
    'M.D.',
    'B.A.',
    'M.A.',
    'J.D.',
    'L.L.D.',
    'Rev.',
    'Gen.',
    'Col.',
    'Capt.',
    'Lt.',
    'Sgt.',
    'Pvt.',
    'No.',
    'Vol.',
    'Dept.',
    'Univ.',
    'Assn.',
    'Bros.',
    'Ste.',
    'Apt.',
    'Fl.',
    'Rm.',
    'Bldg.',
    'Mt.',
    'Ft.',
    'Pt.',
    'Is.',
  ];

  // First, protect abbreviations by temporarily replacing them
  let protectedText = text;
  const replacements = {};

  abbreviations.forEach((abbr, index) => {
    const placeholder = `__ABBREV_${index}__`;
    const regex = new RegExp(abbr.replace('.', '\\.'), 'g');
    protectedText = protectedText.replace(regex, placeholder);
    replacements[placeholder] = abbr;
  });

  // Split on sentence-ending punctuation followed by space and capital letter
  const sentences = protectedText.split(/[.!?]+\s+(?=[A-Z])/);

  // Restore abbreviations and clean up
  return sentences
    .map((sentence) => {
      let restored = sentence.trim();

      // Restore abbreviations
      Object.entries(replacements).forEach(([placeholder, original]) => {
        restored = restored.replace(new RegExp(placeholder, 'g'), original);
      });

      // Add period if it doesn't end with punctuation
      if (!/[.!?]$/.test(restored)) {
        restored += '.';
      }

      return restored;
    })
    .filter((sentence) => sentence.length > 20) // Filter out very short fragments
    .filter((sentence) => {
      // Additional filter: make sure it's not just an abbreviation
      const words = sentence.replace(/[.!?]+$/, '').split(/\s+/);
      return words.length > 2; // Must have more than 2 words
    });
};

console.log('Original text:');
console.log(testText);
console.log('\nSplit sentences:');
const sentences = splitIntoSentences(testText);
sentences.forEach((sentence, index) => {
  console.log(`${index + 1}. "${sentence}"`);
});
