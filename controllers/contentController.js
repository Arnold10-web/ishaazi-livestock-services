// controllers/contentController.js
const News = require('../models/News');
const Blog = require('../models/Blog');
const Farm = require('../models/Farm');
const Magazine = require('../models/Magazine');

// ----- Helper Functions for CRUD Operations -----
const createContent = async (Model, data, res, contentName) => {
  try {
    const item = new Model(data);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: `Error creating ${contentName}`, error });
  }
};

const getContent = async (Model, res, contentName) => {
  try {
    const items = await Model.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: `Error retrieving ${contentName}`, error });
  }
};

const updateContent = async (Model, id, updateData, res, contentName) => {
  try {
    const item = await Model.findByIdAndUpdate(id, updateData, { new: true });
    if (!item) return res.status(404).json({ message: `${contentName} not found` });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: `Error updating ${contentName}`, error });
  }
};

const deleteContent = async (Model, id, res, contentName) => {
  try {
    const item = await Model.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: `${contentName} not found` });
    res.status(200).json({ message: `${contentName} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: `Error deleting ${contentName}`, error });
  }
};

// ----- News CRUD Operations -----
const createNews = (req, res) => createContent(News, req.body, res, 'News');
const getNews = (req, res) => getContent(News, res, 'News');
const updateNews = (req, res) => updateContent(News, req.params.id, req.body, res, 'News');
const deleteNews = (req, res) => deleteContent(News, req.params.id, res, 'News');

// ----- Blog CRUD Operations -----
const createBlog = (req, res) => createContent(Blog, req.body, res, 'Blog');
const getBlog = (req, res) => getContent(Blog, res, 'Blog');
const updateBlog = (req, res) => updateContent(Blog, req.params.id, req.body, res, 'Blog');
const deleteBlog = (req, res) => deleteContent(Blog, req.params.id, res, 'Blog');

// ----- Farm CRUD Operations -----
const createFarm = (req, res) => createContent(Farm, req.body, res, 'Farm');
const getFarm = (req, res) => getContent(Farm, res, 'Farm');
const updateFarm = (req, res) => updateContent(Farm, req.params.id, req.body, res, 'Farm');
const deleteFarm = (req, res) => deleteContent(Farm, req.params.id, res, 'Farm');

// ----- Magazine CRUD Operations -----
const createMagazine = (req, res) => createContent(Magazine, req.body, res, 'Magazine');
const getMagazine = (req, res) => getContent(Magazine, res, 'Magazine');
const updateMagazine = (req, res) => updateContent(Magazine, req.params.id, req.body, res, 'Magazine');
const deleteMagazine = (req, res) => deleteContent(Magazine, req.params.id, res, 'Magazine');

// Consolidated Exports
module.exports = {
  // News
  createNews, getNews, updateNews, deleteNews,
  // Blog
  createBlog, getBlog, updateBlog, deleteBlog,
  // Farm
  createFarm, getFarm, updateFarm, deleteFarm,
  // Magazine
  createMagazine, getMagazine, updateMagazine, deleteMagazine,
};
