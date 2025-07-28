/**
 * IndexedDB Service for Academic Editor
 * Provides modern, asynchronous data storage with better performance than localStorage
 */

class IndexedDBService {
  constructor() {
    this.dbName = 'SCAI_AcademicEditor';
    this.version = 1;
    this.db = null;
    
    // Store names
    this.stores = {
      documents: 'documents',
      settings: 'settings',
      metadata: 'metadata'
    };
  }

  /**
   * Initialize the database
   */
  async init() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create documents store
        if (!db.objectStoreNames.contains(this.stores.documents)) {
          const documentsStore = db.createObjectStore(this.stores.documents, {
            keyPath: 'id'
          });
          
          // Create indexes for better querying
          documentsStore.createIndex('title', 'title', { unique: false });
          documentsStore.createIndex('createdAt', 'createdAt', { unique: false });
          documentsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          documentsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(this.stores.settings)) {
          db.createObjectStore(this.stores.settings, {
            keyPath: 'key'
          });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(this.stores.metadata)) {
          db.createObjectStore(this.stores.metadata, {
            keyPath: 'key'
          });
        }

        console.log('IndexedDB schema created/updated');
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  /**
   * Save a document
   */
  async saveDocument(document) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.documents], 'readwrite');
      const store = transaction.objectStore(this.stores.documents);
      
      // Ensure document has required fields
      const docToSave = {
        ...document,
        updatedAt: new Date().toISOString(),
        version: (document.version || 0) + 1
      };
      
      const request = store.put(docToSave);
      
      request.onsuccess = () => {
        console.log('Document saved successfully:', docToSave.id);
        resolve(docToSave);
      };
      
      request.onerror = () => {
        console.error('Failed to save document:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load a document by ID
   */
  async loadDocument(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.documents], 'readonly');
      const store = transaction.objectStore(this.stores.documents);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const document = request.result;
        if (document) {
          console.log('Document loaded successfully:', id);
          resolve(document);
        } else {
          console.warn('Document not found:', id);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('Failed to load document:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all documents
   */
  async getAllDocuments() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.documents], 'readonly');
      const store = transaction.objectStore(this.stores.documents);
      const index = store.index('updatedAt');
      const request = index.openCursor(null, 'prev'); // Sort by updatedAt descending
      
      const documents = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          documents.push(cursor.value);
          cursor.continue();
        } else {
          console.log('All documents loaded:', documents.length);
          resolve(documents);
        }
      };
      
      request.onerror = () => {
        console.error('Failed to load documents:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a document
   */
  async deleteDocument(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.documents], 'readwrite');
      const store = transaction.objectStore(this.stores.documents);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('Document deleted successfully:', id);
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('Failed to delete document:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update document metadata
   */
  async updateDocument(id, updates) {
    await this.ensureDB();
    
    const document = await this.loadDocument(id);
    if (!document) {
      throw new Error(`Document not found: ${id}`);
    }
    
    const updatedDocument = {
      ...document,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (document.version || 0) + 1
    };
    
    return await this.saveDocument(updatedDocument);
  }

  /**
   * Search documents by title or content
   */
  async searchDocuments(query) {
    const documents = await this.getAllDocuments();
    const searchTerm = query.toLowerCase();
    
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.description?.toLowerCase().includes(searchTerm) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get documents by tag
   */
  async getDocumentsByTag(tag) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.documents], 'readonly');
      const store = transaction.objectStore(this.stores.documents);
      const index = store.index('tags');
      const request = index.getAll(tag);
      
      request.onsuccess = () => {
        console.log('Documents by tag loaded:', tag, request.result.length);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Failed to load documents by tag:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save settings
   */
  async saveSetting(key, value) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.settings], 'readwrite');
      const store = transaction.objectStore(this.stores.settings);
      const request = store.put({ key, value, updatedAt: new Date().toISOString() });
      
      request.onsuccess = () => {
        resolve(value);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Load settings
   */
  async loadSetting(key, defaultValue = null) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.settings], 'readonly');
      const store = transaction.objectStore(this.stores.settings);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAllData() {
    await this.ensureDB();
    
    const storeNames = Object.values(this.stores);
    const transaction = this.db.transaction(storeNames, 'readwrite');
    
    const promises = storeNames.map(storeName => {
      return new Promise((resolve, reject) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
    
    await Promise.all(promises);
    console.log('All data cleared from IndexedDB');
  }

  /**
   * Get database statistics
   */
  async getStats() {
    await this.ensureDB();
    
    const documents = await this.getAllDocuments();
    const totalSize = JSON.stringify(documents).length;
    
    return {
      documentsCount: documents.length,
      totalSize: totalSize,
      formattedSize: this.formatBytes(totalSize),
      lastUpdated: documents.length > 0 ? documents[0].updatedAt : null
    };
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;
