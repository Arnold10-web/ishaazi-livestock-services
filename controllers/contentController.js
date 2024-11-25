// controllers/contentController.js
const Blog = require('../models/Blog');
const News = require('../models/News');
const FarmBasics = require('../models/FarmBasics');
const FarmsForSale = require('../models/FarmsForSale');
const Magazine = require('../models/Magazine');
const fs = require('fs');
const path = require('path');

// Utility: Normalize file paths
const normalizePath = (filePath) => path.resolve(`.${filePath}`);

// Utility: Validate metadata
const parseMetadata = (metadata) => {
  try {
    return metadata ? JSON.parse(metadata) : {};
  } catch {
    throw new Error('Invalid metadata format. Must be a valid JSON string.');
  }
};

// Utility: Generic CRUD Response Helper
const sendResponse = (res, success, message, data = null, error = null) => {
  res.status(success ? 200 : 500).json({ success, message, data, error });
};

// ----- Blog CRUD -----
exports.createBlog = async (req, res) => {
  const { title, content, metadata } = req.body;
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  if (!title || !content) {
    return sendResponse(res, false, 'Title and content are required.');
  }

  try {
    const parsedMetadata = parseMetadata(metadata);
    const blog = new Blog({ title, content, imageUrl, metadata: parsedMetadata });
    await blog.save();
    sendResponse(res, true, 'Blog created successfully', blog);
  } catch (error) {
    sendResponse(res, false, 'Failed to create blog', null, error.message);
  }
};

// Combined Public and Admin Blog Fetch
exports.getBlogs = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true }; // Admin sees all, public sees published
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Blog.countDocuments(query);
    sendResponse(res, true, 'Blogs retrieved successfully', { blogs, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve blogs', null, error.message);
  }
};

exports.updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, content, metadata } = req.body;
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  try {
    const parsedMetadata = metadata ? parseMetadata(metadata) : undefined;
    const blog = await Blog.findById(id);
    if (!blog) return sendResponse(res, false, 'Blog not found.');

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.metadata = parsedMetadata || blog.metadata;

    if (imageUrl) {
      if (blog.imageUrl) fs.unlinkSync(normalizePath(blog.imageUrl));
      blog.imageUrl = imageUrl;
    }

    await blog.save();
    sendResponse(res, true, 'Blog updated successfully', blog);
  } catch (error) {
    sendResponse(res, false, 'Failed to update blog', null, error.message);
  }
};

exports.deleteBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findById(id);
    if (!blog) return sendResponse(res, false, 'Blog not found.');

    if (blog.imageUrl) fs.unlinkSync(normalizePath(blog.imageUrl));
    await blog.remove();
    sendResponse(res, true, 'Blog deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete blog', null, error.message);
  }
};


// ----- News CRUD -----
exports.createNews = async (req, res) => {
  const { title, content, metadata } = req.body;
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  if (!title || !content) {
    return sendResponse(res, false, 'Title and content are required.');
  }

  try {
    const parsedMetadata = parseMetadata(metadata);
    const news = new News({ title, content, imageUrl, metadata: parsedMetadata });
    await news.save();
    sendResponse(res, true, 'News created successfully', news);
  } catch (error) {
    sendResponse(res, false, 'Failed to create news', null, error.message);
  }
};

exports.getNews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const news = await News.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await News.countDocuments();
    sendResponse(res, true, 'News retrieved successfully', { news, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve news', null, error.message);
  }
};

exports.updateNews = async (req, res) => {
  const { id } = req.params;
  const { title, content, metadata } = req.body;
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  try {
    const parsedMetadata = metadata ? parseMetadata(metadata) : undefined;
    const news = await News.findById(id);
    if (!news) return sendResponse(res, false, 'News not found.');

    news.title = title || news.title;
    news.content = content || news.content;
    news.metadata = parsedMetadata || news.metadata;

    if (imageUrl) {
      if (news.imageUrl) fs.unlinkSync(normalizePath(news.imageUrl));
      news.imageUrl = imageUrl;
    }

    await news.save();
    sendResponse(res, true, 'News updated successfully', news);
  } catch (error) {
    sendResponse(res, false, 'Failed to update news', null, error.message);
  }
};

exports.deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await News.findById(id);
    if (!news) return sendResponse(res, false, 'News not found.');

    if (news.imageUrl) fs.unlinkSync(normalizePath(news.imageUrl));
    await news.remove();
    sendResponse(res, true, 'News deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete news', null, error.message);
  }
};

// ----- FarmBasics CRUD -----
exports.createFarmBasics = async (req, res) => {
  const { title, description, type } = req.body; // `type` can be 'video' or 'audio'
  const fileUrl = req.file ? `/uploads/media/${req.file.filename}` : null;

  if (!title || !type) {
    return sendResponse(res, false, 'Title and type are required.');
  }

  try {
    const farmBasics = new FarmBasics({ title, description, type, fileUrl });
    await farmBasics.save();
    sendResponse(res, true, 'FarmBasics created successfully', farmBasics);
  } catch (error) {
    sendResponse(res, false, 'Failed to create FarmBasics', null, error.message);
  }
};

exports.getFarmBasics = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const farmBasics = await FarmBasics.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await FarmBasics.countDocuments();
    sendResponse(res, true, 'FarmBasics retrieved successfully', { farmBasics, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve FarmBasics', null, error.message);
  }
};

exports.updateFarmBasics = async (req, res) => {
  const { id } = req.params;
  const { title, description, type } = req.body;
  const fileUrl = req.file ? `/uploads/media/${req.file.filename}` : null;

  try {
    const farmBasics = await FarmBasics.findById(id);
    if (!farmBasics) return sendResponse(res, false, 'FarmBasics not found.');

    farmBasics.title = title || farmBasics.title;
    farmBasics.description = description || farmBasics.description;
    farmBasics.type = type || farmBasics.type;

    if (fileUrl) {
      if (farmBasics.fileUrl) fs.unlinkSync(normalizePath(farmBasics.fileUrl)); // Delete old file
      farmBasics.fileUrl = fileUrl;
    }

    await farmBasics.save();
    sendResponse(res, true, 'FarmBasics updated successfully', farmBasics);
  } catch (error) {
    sendResponse(res, false, 'Failed to update FarmBasics', null, error.message);
  }
};

exports.deleteFarmBasics = async (req, res) => {
  const { id } = req.params;

  try {
    const farmBasics = await FarmBasics.findById(id);
    if (!farmBasics) return sendResponse(res, false, 'FarmBasics not found.');

    if (farmBasics.fileUrl) fs.unlinkSync(normalizePath(farmBasics.fileUrl)); // Delete associated file
    await farmBasics.remove();
    sendResponse(res, true, 'FarmBasics deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete FarmBasics', null, error.message);
  }
};

// ----- FarmsForSale CRUD -----
exports.createFarmsForSale = async (req, res) => {
  const { name, location, price, description } = req.body;
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  if (!name || !location || !price) {
    return sendResponse(res, false, 'Name, location, and price are required.');
  }

  try {
    const farmsForSale = new FarmsForSale({ name, location, price, description, imageUrl });
    await farmsForSale.save();
    sendResponse(res, true, 'FarmsForSale created successfully', farmsForSale);
  } catch (error) {
    sendResponse(res, false, 'Failed to create FarmsForSale', null, error.message);
  }
};

exports.getFarmsForSale = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const farmsForSale = await FarmsForSale.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await FarmsForSale.countDocuments();
    sendResponse(res, true, 'FarmsForSale retrieved successfully', { farmsForSale, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve FarmsForSale', null, error.message);
  }
};

exports.updateFarmsForSale = async (req, res) => {
  const { id } = req.params;
  const { name, location, price, description } = req.body;
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  try {
    const farmsForSale = await FarmsForSale.findById(id);
    if (!farmsForSale) return sendResponse(res, false, 'FarmsForSale not found.');

    farmsForSale.name = name || farmsForSale.name;
    farmsForSale.location = location || farmsForSale.location;
    farmsForSale.price = price || farmsForSale.price;
    farmsForSale.description = description || farmsForSale.description;

    if (imageUrl) {
      if (farmsForSale.imageUrl) fs.unlinkSync(normalizePath(farmsForSale.imageUrl)); // Delete old image
      farmsForSale.imageUrl = imageUrl;
    }

    await farmsForSale.save();
    sendResponse(res, true, 'FarmsForSale updated successfully', farmsForSale);
  } catch (error) {
    sendResponse(res, false, 'Failed to update FarmsForSale', null, error.message);
  }
};

exports.deleteFarmsForSale = async (req, res) => {
  const { id } = req.params;

  try {
    const farmsForSale = await FarmsForSale.findById(id);
    if (!farmsForSale) return sendResponse(res, false, 'FarmsForSale not found.');

    if (farmsForSale.imageUrl) fs.unlinkSync(normalizePath(farmsForSale.imageUrl)); // Delete associated image
    await farmsForSale.remove();
    sendResponse(res, true, 'FarmsForSale deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete FarmsForSale', null, error.message);
  }
};

// ----- Magazine CRUD -----
exports.createMagazine = async (req, res) => {
  const { title, description, price, discount } = req.body;
  const fileUrl = req.file ? `/uploads/media/${req.file.filename}` : null;

  if (!title || !price) {
    return sendResponse(res, false, 'Title and price are required.');
  }

  try {
    const magazine = new Magazine({ title, description, price, discount, fileUrl });
    await magazine.save();
    sendResponse(res, true, 'Magazine created successfully', magazine);
  } catch (error) {
    sendResponse(res, false, 'Failed to create Magazine', null, error.message);
  }
};

exports.getMagazines = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const magazines = await Magazine.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Magazine.countDocuments();
    sendResponse(res, true, 'Magazines retrieved successfully', { magazines, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve Magazines', null, error.message);
  }
};

exports.updateMagazine = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, discount } = req.body;
  const fileUrl = req.file ? `/uploads/media/${req.file.filename}` : null;

  try {
    const magazine = await Magazine.findById(id);
    if (!magazine) return sendResponse(res, false, 'Magazine not found.');

    magazine.title = title || magazine.title;
    magazine.description = description || magazine.description;
    magazine.price = price || magazine.price;
    magazine.discount = discount || magazine.discount;

    if (fileUrl) {
      if (magazine.fileUrl) fs.unlinkSync(normalizePath(magazine.fileUrl)); // Delete old file
      magazine.fileUrl = fileUrl;
    }

    await magazine.save();
    sendResponse(res, true, 'Magazine updated successfully', magazine);
  } catch (error) {
    sendResponse(res, false, 'Failed to update Magazine', null, error.message);
  }
};

exports.deleteMagazine = async (req, res) => {
  const { id } = req.params;

  try {
    const magazine = await Magazine.findById(id);
    if (!magazine) return sendResponse(res, false, 'Magazine not found.');

    if (magazine.fileUrl) fs.unlinkSync(normalizePath(magazine.fileUrl)); // Delete associated file
    await magazine.remove();
    sendResponse(res, true, 'Magazine deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete Magazine', null, error.message);
  }
};

