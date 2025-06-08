// This file contains the patterns for updating all the farming forms to be user-friendly

// STATE VARIABLES PATTERN - Replace the old metadata state with user-friendly fields:
/*
OLD:
const [metadata, setMetadata] = useState('{}');

NEW:
const [author, setAuthor] = useState('');
const [category, setCategory] = useState('FORM_DEFAULT_CATEGORY');
const [tags, setTags] = useState('');
const [keywords, setKeywords] = useState('');
const [summary, setSummary] = useState('');
const [published, setPublished] = useState(true);
const [featured, setFeatured] = useState(false);
const [readTime, setReadTime] = useState(5);
*/

// USEEFFECT PATTERN - Update the editing useEffect:
/*
OLD:
setMetadata(JSON.stringify(editingItem.metadata));

NEW:
setCategory(editingItem.category || 'DEFAULT_CATEGORY');
setTags(editingItem.tags ? editingItem.tags.join(', ') : '');
setPublished(editingItem.published !== undefined ? editingItem.published : true);
setFeatured(editingItem.featured || false);
setReadTime(editingItem.readTime || 5);

// Extract from metadata if it exists
if (editingItem.metadata) {
  setAuthor(editingItem.metadata.author || '');
  setKeywords(editingItem.metadata.keywords ? editingItem.metadata.keywords.join(', ') : '');
  setSummary(editingItem.metadata.summary || '');
}
*/

// RESET FORM PATTERN:
/*
OLD:
setMetadata('{}');

NEW:
setAuthor('');
setCategory('DEFAULT_CATEGORY');
setTags('');
setKeywords('');
setSummary('');
setPublished(true);
setFeatured(false);
setReadTime(5);
*/

// GENERATE METADATA FUNCTION - Add this new function:
/*
const generateMetadata = () => {
  const metadata = {};
  if (keywords.trim()) metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
  if (summary.trim()) metadata.summary = summary.trim();
  if (author.trim()) metadata.author = author.trim();
  return metadata;
};
*/

// SUBMIT FUNCTION PATTERN:
/*
OLD:
try {
  JSON.parse(metadata);
} catch (err) {
  setError('Invalid metadata JSON format.');
  return;
}
formData.append('metadata', metadata);

NEW:
const metadata = generateMetadata();
const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

formData.append('category', category);
formData.append('tags', JSON.stringify(parsedTags));
formData.append('metadata', JSON.stringify(metadata));
formData.append('published', published);
formData.append('featured', featured);
formData.append('readTime', readTime);
*/

// CATEGORIES BY FORM TYPE:
const CATEGORIES = {
  Goat: ['Goat', 'Goat Management', 'Goat Health', 'Goat Nutrition', 'Goat Breeding', 'Goat Business'],
  Piggery: ['Piggery', 'Pig Management', 'Pig Health', 'Pig Nutrition', 'Pig Breeding', 'Pig Business'],
  Beef: ['Beef', 'Cattle Management', 'Beef Health', 'Beef Nutrition', 'Cattle Breeding', 'Beef Business'],
  Dairy: ['Dairy', 'Dairy Management', 'Dairy Technology', 'Dairy Health', 'Dairy Nutrition', 'Dairy Business']
};

export default CATEGORIES;
