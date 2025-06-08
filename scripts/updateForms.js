#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const FORMS_CONFIG = {
  'GoatForm.js': {
    modelName: 'Goat',
    displayName: 'Goat Farming',
    categories: ['Goat', 'Goat Management', 'Goat Health', 'Goat Nutrition', 'Goat Breeding', 'Goat Business'],
    apiEndpoints: { create: 'CREATE_GOAT', update: 'UPDATE_GOAT' },
    refreshFunction: 'refreshGoats',
    editingProp: 'editingGoat',
    setEditingProp: 'setEditingGoat'
  },
  'PiggeryForm.js': {
    modelName: 'Piggery',
    displayName: 'Piggery',
    categories: ['Piggery', 'Pig Management', 'Pig Health', 'Pig Nutrition', 'Pig Breeding', 'Pig Business'],
    apiEndpoints: { create: 'CREATE_PIGGERY', update: 'UPDATE_PIGGERY' },
    refreshFunction: 'refreshPiggeries',
    editingProp: 'editingPiggery',
    setEditingProp: 'setEditingPiggery'
  },
  'BeefForm.js': {
    modelName: 'Beef',
    displayName: 'Beef Farming',
    categories: ['Beef', 'Cattle Management', 'Beef Health', 'Beef Nutrition', 'Cattle Breeding', 'Beef Business'],
    apiEndpoints: { create: 'CREATE_BEEF', update: 'UPDATE_BEEF' },
    refreshFunction: 'refreshBeefs',
    editingProp: 'editingBeef',
    setEditingProp: 'setEditingBeef'
  }
};

const generateUserFriendlyFields = (config) => {
  const categoryOptions = config.categories.map(cat => `              <option value="${cat}">${cat}</option>`).join('\n');
  
  return `        {/* User-friendly metadata fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              id="author"
              type="text"
              placeholder="Enter author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            >
${categoryOptions}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              id="tags"
              type="text"
              placeholder="Enter tags separated by commas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., ${config.modelName.toLowerCase()} farming, management, health</p>
          </div>
          
          <div>
            <label htmlFor="readTime" className="block text-sm font-medium text-gray-700 mb-1">Read Time (minutes)</label>
            <input
              id="readTime"
              type="number"
              min="1"
              max="60"
              value={readTime}
              onChange={(e) => setReadTime(parseInt(e.target.value) || 5)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </div>
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
          <input
            id="keywords"
            type="text"
            placeholder="Enter SEO keywords separated by commas"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          />
          <p className="text-xs text-gray-500 mt-1">Keywords for search engine optimization</p>
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
          <textarea
            id="summary"
            placeholder="Enter a brief summary of the content"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          />
          <p className="text-xs text-gray-500 mt-1">Brief description for previews and search results</p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
              Publish immediately
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Featured content
            </label>
          </div>
        </div>`;
};

console.log('Form update templates generated successfully!');
console.log('Use these templates to manually update the remaining forms.');
