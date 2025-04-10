import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import Blog from '../models/Blog.js';
import Event from '../models/Event.js';
import News from '../models/News.js';
import Basic from '../models/Basic.js';
import Farm from '../models/Farm.js';
import Magazine from '../models/Magazine.js';
import Dairy from '../models/Dairy.js';
import Goat from '../models/Goat.js';
import Piggery from '../models/Piggery.js';
import Beef from '../models/Beef.js';
import Newsletter from '../models/Newsletter.js';
import Subscriber from '../models/Subscriber.js';
import nodemailer from 'nodemailer';

// Define __dirname manually for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility: Normalize file paths
const normalizePath = (filePath) => path.resolve(__dirname, `..${filePath}`);

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

// ----- BLOG CRUD -----
export const createBlog = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newBlog = new Blog({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedBlog = await newBlog.save();
    sendResponse(res, true, 'Blog created successfully', savedBlog);
  } catch (error) {
    sendResponse(res, false, 'Failed to create blog', null, error.message);
  }
};
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getBlogs = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };

    console.log("🔥 API HIT: Fetching blogs...");
    console.log("🔍 Query:", query);

    // Log the total number of blogs in the database
    const totalBlogs = await Blog.countDocuments({});
    console.log("Total blogs in database:", totalBlogs);

    // Log the number of published blogs
    const publishedBlogsCount = await Blog.countDocuments({ published: true });
    console.log("Published blogs in database:", publishedBlogsCount);

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    console.log("✅ Blogs found:", blogs.length);
    if (blogs.length > 0) console.log("Sample blog:", blogs[0]);

    const total = await Blog.countDocuments(query);

    sendResponse(res, true, 'Blogs retrieved successfully', { blogs, total, page, limit });
  } catch (error) {
    console.error("❌ Error fetching blogs:", error);
    sendResponse(res, false, 'Failed to retrieve blogs', null, error.message);
  }
};
export const getAdminBlogs = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Blog.countDocuments();

    res.json({
      blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published } = req.body;
    let updateData = { title, content, metadata, published };

    if (req.file) {
      // Construct the relative path
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Delete the associated image file if it exists
    if (blog.imageUrl) {
      const imagePath = path.join(__dirname, '..', blog.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the blog from the database
    await Blog.findByIdAndDelete(id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Failed to delete blog' });
  }
};
// ----- NEWS CRUD -----
export const createNews = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newNews = new News({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedNews = await newNews.save();
    sendResponse(res, true, 'News created successfully', savedNews);
  } catch (error) {
    sendResponse(res, false, 'Failed to create news', null, error.message);
  }
};

export const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getNews = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await News.countDocuments(query);
    sendResponse(res, true, 'News retrieved successfully', { news, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve news', null, error.message);
  }
};

export const getAdminNews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const news = await News.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await News.countDocuments();

    res.json({
      news,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published } = req.body;
    let updateData = { title, content, metadata, published };

    if (req.file) {
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedNews = await News.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Delete the associated image file if it exists
    if (news.imageUrl) {
      const imagePath = path.join(__dirname, '..', news.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the news from the database
    await News.findByIdAndDelete(id);

    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ message: 'Failed to delete news' });
  }
};

// ----- BASIC CRUD OPERATIONS -----

// Create a new Basic media
export const createBasic = async (req, res) => {
  try {
    const { title, description, fileType, metadata } = req.body;

    // Extract uploaded files
    const files = req.files || {};
    const image = files.image?.[0]; // Thumbnail
    const media = files.media?.[0]; // Video/Audio

    // Ensure media file is provided
    if (!title || !description || !fileType || !media) {
      return sendResponse(res, false, 'Title, description, file type, and media file are required.');
    }

    // Construct file paths
    const fileUrl = `/uploads/media/${media.filename}`;
    const imageUrl = image ? `/uploads/images/${image.filename}` : null;

    // Parse metadata
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    // Create and save Basic media
    const newBasic = new Basic({
      title,
      description,
      fileUrl,
      imageUrl,
      fileType,
      metadata: parsedMetadata,
    });

    const savedBasic = await newBasic.save();
    sendResponse(res, true, 'Basic media created successfully', savedBasic);
  } catch (error) {
    sendResponse(res, false, 'Failed to create basic media', null, error.message);
  }
};

// Get all Basics with pagination
export const getBasics = async (req, res) => {
  const { page = 1, limit = 10, fileType } = req.query;

  try {
    const query = fileType ? { fileType } : {};
    const basics = await Basic.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Basic.countDocuments(query);
    sendResponse(res, true, 'Basics retrieved successfully', { basics, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve basics', null, error.message);
  }
};

// Get all Basics for admin (with pagination)
export const getAdminBasics = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const basics = await Basic.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Basic.countDocuments();

    res.status(200).json({
      success: true,
      basics,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin basics',
      error: error.message,
    });
  }
};

// Get a single Basic by ID
export const getBasicById = async (req, res) => {
  try {
    const basic = await Basic.findById(req.params.id);
    if (!basic) {
      return sendResponse(res, false, 'Basic media not found');
    }
    sendResponse(res, true, 'Basic media retrieved successfully', basic);
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve basic media', null, error.message);
  }
};

// Update a Basic media
export const updateBasic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, fileType, metadata } = req.body;

    // Extract uploaded files (if any)
    const files = req.files || {};
    const image = files.image?.[0];
    const media = files.media?.[0];

    // Parse metadata inline
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return res.status(400).json({ message: 'Invalid metadata format' });
    }

    const updateData = {
      title,
      description,
      fileType,
      metadata: parsedMetadata,
    };

    if (media) {
      updateData.fileUrl = `/uploads/media/${media.filename}`;
    }
    if (image) {
      updateData.imageUrl = `/uploads/images/${image.filename}`;
    }

    const updatedBasic = await Basic.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedBasic) {
      return sendResponse(res, false, 'Basic media not found');
    }

    sendResponse(res, true, 'Basic media updated successfully', updatedBasic);
  } catch (error) {
    sendResponse(res, false, 'Failed to update basic media', null, error.message);
  }
};




// Delete a Basic media
export const deleteBasic = async (req, res) => {
  try {
    const { id } = req.params;
    const basic = await Basic.findById(id);

    if (!basic) {
      return sendResponse(res, false, 'Basic media not found');
    }

    // Delete associated media files
    if (basic.fileUrl) {
      const filePath = normalizePath(basic.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (basic.imageUrl) {
      const imagePath = normalizePath(basic.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Basic.findByIdAndDelete(id);
    sendResponse(res, true, 'Basic media deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete basic media', null, error.message);
  }
};

// Add a comment to a Basic media
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return sendResponse(res, false, 'Comment content is required.');
    }

    const basic = await Basic.findById(id);
    if (!basic) {
      return sendResponse(res, false, 'Basic media not found');
    }

    basic.comments.push({ content });
    await basic.save();

    sendResponse(res, true, 'Comment added successfully', basic);
  } catch (error) {
    sendResponse(res, false, 'Failed to add comment', null, error.message);
  }
};

// Delete a comment from a Basic media
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    const basic = await Basic.findById(id);
    if (!basic) {
      return sendResponse(res, false, 'Basic media not found');
    }

    basic.comments = basic.comments.filter((comment) => comment._id.toString() !== commentId);
    await basic.save();

    sendResponse(res, true, 'Comment deleted successfully', basic);
  } catch (error) {
    sendResponse(res, false, 'Failed to delete comment', null, error.message);
  }
};

// ----- FARM CRUD -----

// Create a new farm
export const createFarm = async (req, res) => {
  try {
    const { name, location, price, description, metadata } = req.body;
    let imageUrl = null;

    if (!name || !location || !price || !description) {
      return sendResponse(res, false, 'Name, location, price, and description are required.');
    }

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newFarm = new Farm({
      name,
      location,
      price,
      description,
      imageUrl,
      metadata: parsedMetadata,
    });

    const savedFarm = await newFarm.save();
    sendResponse(res, true, 'Farm created successfully', savedFarm);
  } catch (error) {
    sendResponse(res, false, 'Failed to create farm', null, error.message);
  }
};

// Get a farm by ID
export const getFarmById = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }
    res.json({ success: true, data: farm });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all farms (with optional pagination)
export const getFarms = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : {}; // Adjust if there are fields like "published" to filter non-admin results
    const farms = await Farm.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Farm.countDocuments(query);
    sendResponse(res, true, 'Farms retrieved successfully', { farms, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve farms', null, error.message);
  }
};

// Get farms (admin view with pagination)
export const getAdminFarms = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const farms = await Farm.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Farm.countDocuments();

    res.json({
      farms,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a farm
export const updateFarm = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, price, description, metadata } = req.body;
    let updateData = { name, location, price, description, metadata };

    if (req.file) {
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedFarm = await Farm.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedFarm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



// Delete a farm
export const deleteFarm = async (req, res) => {
  try {
    const { id } = req.params;
    const farm = await Farm.findById(id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Delete the associated image file if it exists
    if (farm.imageUrl) {
      const imagePath = path.join(__dirname, '..', farm.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the farm from the database
    await Farm.findByIdAndDelete(id);

    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    console.error('Error deleting farm:', error);
    res.status(500).json({ message: 'Failed to delete farm' });
  }
};




// ----- MAGAZINE CRUD -----

// Create a new magazine
export const createMagazine = async (req, res) => {
  try {
    const { title, description, issue, price, discount, metadata } = req.body;

    // Check required fields
    if (!title || !description || !issue) {
      return sendResponse(res, false, 'Title, description, and issue are required.');
    }

    // Handle file uploads
    const files = req.files || {};
    const image = files.image?.[0];
    const pdf = files.pdf?.[0];

    if (!image || !pdf) {
      return sendResponse(res, false, 'Both image and PDF file are required.');
    }

    const imageUrl = `/uploads/images/${image.filename}`;
    const fileUrl = `/uploads/pdfs/${pdf.filename}`;

    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = parseMetadata(metadata);
    } catch (error) {
      return sendResponse(res, false, 'Invalid metadata format.');
    }

    const newMagazine = new Magazine({
      title,
      description,
      issue,
      price: price || 0,
      discount: discount || 0,
      imageUrl,
      fileUrl,
      metadata: parsedMetadata,
    });

    const savedMagazine = await newMagazine.save();
    sendResponse(res, true, 'Magazine created successfully', savedMagazine);
  } catch (error) {
    console.error('Error creating magazine:', error);
    sendResponse(res, false, 'Failed to create magazine', null, error.message);
  }
};

// Get a magazine by ID
export const getMagazineById = async (req, res) => {
  try {
    const magazine = await Magazine.findById(req.params.id);
    if (!magazine) {
      return sendResponse(res, false, 'Magazine not found');
    }
    sendResponse(res, true, 'Magazine retrieved successfully', magazine);
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve magazine', null, error.message);
  }
};

// Get all magazines (with pagination)
export const getMagazines = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const magazines = await Magazine.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Magazine.countDocuments(query);
    sendResponse(res, true, 'Magazines retrieved successfully', { magazines, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve magazines', null, error.message);
  }
};
// Get all magazines for admin (with pagination)
export const getAdminMagazines = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const magazines = await Magazine.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Magazine.countDocuments();

    res.status(200).json({
      success: true,
      magazines,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error('Error fetching admin magazines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin magazines',
      error: error.message,
    });
  }
};

// Update a magazine
export const updateMagazine = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, issue, price, discount, metadata, published } = req.body;
    const files = req.files || {};

    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return res.status(400).json({ message: 'Invalid metadata format' });
    }

    const updateData = {
      title,
      description,
      issue,
      price,
      discount,
      metadata: parsedMetadata,
      published,
    };

    if (files.image?.[0]) {
      updateData.imageUrl = `/uploads/images/${files.image[0].filename}`;
    }

    if (files.pdf?.[0]) {
      updateData.fileUrl = `/uploads/pdfs/${files.pdf[0].filename}`;
    }

    const updatedMagazine = await Magazine.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedMagazine) {
      return sendResponse(res, false, 'Magazine not found');
    }

    sendResponse(res, true, 'Magazine updated successfully', updatedMagazine);
  } catch (error) {
    sendResponse(res, false, 'Failed to update magazine', null, error.message);
  }
};


// Delete a magazine
export const deleteMagazine = async (req, res) => {
  try {
    const { id } = req.params;
    const magazine = await Magazine.findById(id);

    if (!magazine) {
      return sendResponse(res, false, 'Magazine not found');
    }

    // Delete associated files
    if (magazine.fileUrl) {
      const filePath = normalizePath(magazine.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (magazine.imageUrl) {
      const imagePath = normalizePath(magazine.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Magazine.findByIdAndDelete(id);
    sendResponse(res, true, 'Magazine deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete magazine', null, error.message);
  }
};


// ----- PIGGERY CRUD -----
export const createPiggery = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newPiggery = new Piggery({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedPiggery = await newPiggery.save();
    sendResponse(res, true, 'Piggery created successfully', savedPiggery);
  } catch (error) {
    sendResponse(res, false, 'Failed to create piggery', null, error.message);
  }
};

export const getPiggeryById = async (req, res) => {
  try {
    const piggery = await Piggery.findById(req.params.id);
    if (!piggery) {
      return res.status(404).json({ success: false, message: 'Piggery not found' });
    }
    res.json({ success: true, data: piggery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getPiggeries = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const piggeries = await Piggery.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Piggery.countDocuments(query);
    sendResponse(res, true, 'Piggeries retrieved successfully', { piggeries, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve piggeries', null, error.message);
  }
};

export const getAdminPiggeries = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const piggeries = await Piggery.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Piggery.countDocuments();

    res.json({
      piggeries,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePiggery = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published } = req.body;

    // Parse metadata from JSON string to object inline
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return res.status(400).json({ message: 'Invalid metadata format' });
    }

    let updateData = { title, content, metadata: parsedMetadata, published };

    if (req.file) {
      // Construct the relative path for the image
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedPiggery = await Piggery.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedPiggery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const deletePiggery = async (req, res) => {
  try {
    const { id } = req.params;
    const piggery = await Piggery.findById(id);

    if (!piggery) {
      return res.status(404).json({ message: 'Piggery not found' });
    }

    // Delete the associated image file if it exists
    if (piggery.imageUrl) {
      const imagePath = path.join(__dirname, '..', piggery.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the piggery from the database
    await Piggery.findByIdAndDelete(id);

    res.json({ message: 'Piggery deleted successfully' });
  } catch (error) {
    console.error('Error deleting piggery:', error);
    res.status(500).json({ message: 'Failed to delete piggery' });
  }
};

// ----- GOAT CRUD -----


export const createGoat = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newGoat = new Goat({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedGoat = await newGoat.save();
    sendResponse(res, true, 'Goat content created successfully', savedGoat);
  } catch (error) {
    sendResponse(res, false, 'Failed to create goat content', null, error.message);
  }
};

export const getGoatById = async (req, res) => {
  try {
    const goat = await Goat.findById(req.params.id);
    if (!goat) {
      return res.status(404).json({ success: false, message: 'Goat content not found' });
    }
    res.json({ success: true, data: goat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getGoats = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const goats = await Goat.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Goat.countDocuments(query);
    sendResponse(res, true, 'Goats retrieved successfully', { goats, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve goats', null, error.message);
  }
};

export const getAdminGoats = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const goats = await Goat.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Goat.countDocuments();

    res.json({
      goats,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateGoat = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published } = req.body;

    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return res.status(400).json({ message: 'Invalid metadata format' });
    }

    let updateData = { title, content, metadata: parsedMetadata, published };

    if (req.file) {
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedGoat = await Goat.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedGoat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const deleteGoat = async (req, res) => {
  try {
    const { id } = req.params;
    const goat = await Goat.findById(id);

    if (!goat) {
      return res.status(404).json({ message: 'Goat content not found' });
    }

    if (goat.imageUrl) {
      const imagePath = path.join(__dirname, '..', goat.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Goat.findByIdAndDelete(id);

    res.json({ message: 'Goat content deleted successfully' });
  } catch (error) {
    console.error('Error deleting goat content:', error);
    res.status(500).json({ message: 'Failed to delete goat content' });
  }
};

// ----- DAIRY CRUD -----

export const createDairy = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newDairy = new Dairy({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedDairy = await newDairy.save();
    sendResponse(res, true, 'Dairy content created successfully', savedDairy);
  } catch (error) {
    sendResponse(res, false, 'Failed to create dairy content', null, error.message);
  }
};

export const getDairyById = async (req, res) => {
  try {
    const dairy = await Dairy.findById(req.params.id);
    if (!dairy) {
      return res.status(404).json({ success: false, message: 'Dairy content not found' });
    }
    res.json({ success: true, data: dairy });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getDairies = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const dairies = await Dairy.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Dairy.countDocuments(query);
    sendResponse(res, true, 'Dairy content retrieved successfully', { dairies, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve dairy content', null, error.message);
  }
};

export const getAdminDairies = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const dairies = await Dairy.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Dairy.countDocuments();

    res.json({
      dairies,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDairy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published } = req.body;
    // Parse metadata to ensure it's stored as an object:
    const parsedMetadata = parseMetadata(metadata);
    let updateData = { title, content, metadata: parsedMetadata, published };

    if (req.file) {
      // Construct the relative path for the updated image
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedDairy = await Dairy.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedDairy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const deleteDairy = async (req, res) => {
  try {
    const { id } = req.params;
    const dairy = await Dairy.findById(id);

    if (!dairy) {
      return res.status(404).json({ message: 'Dairy content not found' });
    }

    // Delete the associated image file if it exists
    if (dairy.imageUrl) {
      const imagePath = path.join(__dirname, '..', dairy.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the dairy content from the database
    await Dairy.findByIdAndDelete(id);

    res.json({ message: 'Dairy content deleted successfully' });
  } catch (error) {
    console.error('Error deleting dairy content:', error);
    res.status(500).json({ message: 'Failed to delete dairy content' });
  }
};

// ----- BEEF CRUD -----

export const createBeef = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newBeef = new Beef({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedBeef = await newBeef.save();
    sendResponse(res, true, 'Beef content created successfully', savedBeef);
  } catch (error) {
    sendResponse(res, false, 'Failed to create beef content', null, error.message);
  }
};

export const getBeefById = async (req, res) => {
  try {
    const beef = await Beef.findById(req.params.id);
    if (!beef) {
      return sendResponse(res, false, 'Beef content not found', null, null, 404);
    }
    sendResponse(res, true, 'Beef content retrieved successfully', beef);
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve beef content', null, error.message, 500);
  }
};

export const getBeefs = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const beefs = await Beef.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Beef.countDocuments(query);
    sendResponse(res, true, 'Beef content retrieved successfully', { beefs, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve beef content', null, error.message);
  }
};

export const getAdminBeefs = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const beefs = await Beef.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Beef.countDocuments();

    sendResponse(res, true, 'Admin beefs retrieved successfully', {
      beefs,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve admin beefs', null, error.message);
  }
};
export const updateBeef = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published } = req.body;
    // Parse the metadata string into an object
    const parsedMetadata = parseMetadata(metadata);
    let updateData = { title, content, metadata: parsedMetadata, published };

    if (req.file) {
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedBeef = await Beef.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedBeef) {
      return sendResponse(res, false, 'Beef content not found', null, null, 404);
    }
    sendResponse(res, true, 'Beef content updated successfully', updatedBeef);
  } catch (error) {
    sendResponse(res, false, 'Failed to update beef content', null, error.message);
  }
};


export const deleteBeef = async (req, res) => {
  try {
    const { id } = req.params;
    const beef = await Beef.findById(id);

    if (!beef) {
      return sendResponse(res, false, 'Beef content not found', null, null, 404);
    }

    if (beef.imageUrl) {
      const imagePath = path.join(__dirname, '..', beef.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Beef.findByIdAndDelete(id);

    sendResponse(res, true, 'Beef content deleted successfully');
  } catch (error) {
    console.error('Error deleting beef content:', error);
    sendResponse(res, false, 'Failed to delete beef content', null, error.message);
  }
};


// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
});

// Fetch all subscribers
export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find();
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
};

// Add a subscriber
export const createSubscriber = async (req, res) => {
  const { email } = req.body;
  try {
    const subscriber = new Subscriber({ email });
    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (error) {
    res.status(400).json({ message: 'Error adding subscriber' });
  }
};

// Delete a subscriber
export const deleteSubscriber = async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Subscriber deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subscriber' });
  }
};

// Fetch all newsletters
export const getNewsletters = async (req, res) => {
  try {
    const newsletters = await Newsletter.find();
    res.status(200).json(newsletters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching newsletters' });
  }
};

// Create a new newsletter
export const createNewsletter = async (req, res) => {
  const { title, body } = req.body;
  try {
    const newsletter = new Newsletter({ title, body });
    await newsletter.save();
    res.status(201).json(newsletter);
  } catch (error) {
    res.status(400).json({ message: 'Error creating newsletter' });
  }
};

// Update a newsletter
export const updateNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(newsletter);
  } catch (error) {
    res.status(500).json({ message: 'Error updating newsletter' });
  }
};

// Delete a newsletter
export const deleteNewsletter = async (req, res) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Newsletter deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting newsletter' });
  }
};

// Send a newsletter
export const sendNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) return res.status(404).json({ message: 'Newsletter not found' });

    const subscribers = await Subscriber.find();
    const emails = subscribers.map((sub) => sub.email);

    // Send emails
    for (const email of emails) {
      await transporter.sendMail({
        from: 'your-email@gmail.com',
        to: email,
        subject: newsletter.title,
        html: newsletter.body,
      });
    }

    newsletter.sentAt = new Date();
    await newsletter.save();

    res.status(200).json({ message: 'Newsletter sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending newsletter' });
  }
};

// ----- EVENT CRUD -----
export const createEvent = async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, metadata, published } = req.body;
    let imageUrl = null;

    // Check required fields
    if (!title || !description || !startDate) {
      return sendResponse(res, false, 'Title, description, and start date are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    // Safely parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (err) {
      console.error("Metadata parsing error:", err);
      return sendResponse(res, false, 'Invalid metadata format. Please provide valid JSON.');
    }

    const newEvent = new Event({
      title,
      description,
      startDate,
      endDate: endDate || null,
      location: location || "",
      imageUrl,
      metadata: parsedMetadata,
      published: published !== undefined ? published : true
    });

    const savedEvent = await newEvent.save();
    sendResponse(res, true, 'Event created successfully', savedEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    sendResponse(res, false, 'Failed to create event', null, error.message);
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getEvents = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };

    console.log("🔥 API HIT: Fetching events...");
    console.log("🔍 Query:", query);

    const totalEvents = await Event.countDocuments({});
    console.log("Total events in database:", totalEvents);

    const publishedEventsCount = await Event.countDocuments({ published: true });
    console.log("Published events in database:", publishedEventsCount);

    // Updated sort to use startDate instead of date
    const events = await Event.find(query)
      .sort({ startDate: 1 }) // Sort by startDate ascending
      .skip((page - 1) * limit)
      .limit(Number(limit));

    console.log("✅ Events found:", events.length);
    if (events.length > 0) console.log("Sample event:", events[0]);

    const total = await Event.countDocuments(query);

    sendResponse(res, true, 'Events retrieved successfully', { events, total, page, limit });
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    sendResponse(res, false, 'Failed to retrieve events', null, error.message);
  }
};

export const getAdminEvents = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    // Updated sort to use startDate instead of date
    const events = await Event.find()
      .sort({ startDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Event.countDocuments();

    res.json({
      events,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, location, metadata, published } = req.body;
    
    // Safely parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (err) {
      return res.status(400).json({ message: 'Invalid metadata format. Please provide valid JSON.' });
    }
    
    let updateData = { 
      title, 
      description, 
      startDate,
      endDate,
      location,
      metadata: parsedMetadata,
      published
    };

    if (req.file) {
      // Construct the relative path
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    sendResponse(res, true, 'Event updated successfully', updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    sendResponse(res, false, 'Failed to update event', null, error.message);
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete the associated image file if it exists
    if (event.imageUrl) {
      const imagePath = path.join(__dirname, '..', event.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the event from the database
    await Event.findByIdAndDelete(id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};