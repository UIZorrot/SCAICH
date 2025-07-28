/**
 * Data Migration Service
 * Handles migration from localStorage to IndexedDB
 */

import indexedDBService from './IndexedDBService';

class DataMigrationService {
  constructor() {
    this.MIGRATION_KEY = 'scai_data_migrated';
    this.OLD_DOCUMENTS_KEY = 'scai_documents';
    this.OLD_CURRENT_DOC_KEY = 'scai_current_document';
    this.OLD_SETTINGS_KEYS = [
      'scai_editor_settings',
      'scai_ai_settings',
      'scai_ui_preferences'
    ];
  }

  /**
   * Check if migration is needed
   */
  needsMigration() {
    // Check if migration has already been completed
    const migrationCompleted = localStorage.getItem(this.MIGRATION_KEY);
    if (migrationCompleted) {
      return false;
    }

    // Check if there's any old data to migrate
    const hasOldDocuments = localStorage.getItem(this.OLD_DOCUMENTS_KEY);
    const hasOldCurrentDoc = localStorage.getItem(this.OLD_CURRENT_DOC_KEY);
    const hasOldSettings = this.OLD_SETTINGS_KEYS.some(key => 
      localStorage.getItem(key)
    );

    return !!(hasOldDocuments || hasOldCurrentDoc || hasOldSettings);
  }

  /**
   * Perform the migration
   */
  async migrate() {
    if (!this.needsMigration()) {
      console.log('No migration needed');
      return { success: true, migrated: 0 };
    }

    console.log('Starting data migration from localStorage to IndexedDB...');
    
    try {
      let migratedCount = 0;
      
      // Initialize IndexedDB
      await indexedDBService.init();
      
      // Migrate documents
      const documentsResult = await this.migrateDocuments();
      migratedCount += documentsResult.count;
      
      // Migrate current document
      const currentDocResult = await this.migrateCurrentDocument();
      if (currentDocResult.migrated) {
        migratedCount += 1;
      }
      
      // Migrate settings
      const settingsResult = await this.migrateSettings();
      migratedCount += settingsResult.count;
      
      // Mark migration as completed
      localStorage.setItem(this.MIGRATION_KEY, JSON.stringify({
        completed: true,
        timestamp: new Date().toISOString(),
        migratedCount
      }));
      
      console.log(`Migration completed successfully. Migrated ${migratedCount} items.`);
      
      return {
        success: true,
        migrated: migratedCount,
        documents: documentsResult.count,
        settings: settingsResult.count,
        currentDocument: currentDocResult.migrated
      };
      
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Migrate documents from localStorage
   */
  async migrateDocuments() {
    const documentsJson = localStorage.getItem(this.OLD_DOCUMENTS_KEY);
    if (!documentsJson) {
      return { count: 0 };
    }

    try {
      const documents = JSON.parse(documentsJson);
      if (!Array.isArray(documents)) {
        console.warn('Invalid documents format in localStorage');
        return { count: 0 };
      }

      let migratedCount = 0;
      
      for (const doc of documents) {
        try {
          // Ensure document has required fields
          const migratedDoc = {
            ...doc,
            id: doc.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: doc.createdAt || new Date().toISOString(),
            updatedAt: doc.updatedAt || new Date().toISOString(),
            version: doc.version || 1,
            wordCount: doc.wordCount || 0,
            characterCount: doc.characterCount || 0,
            tags: doc.tags || []
          };
          
          await indexedDBService.saveDocument(migratedDoc);
          migratedCount++;
          
        } catch (docError) {
          console.error('Failed to migrate document:', doc.id, docError);
        }
      }
      
      console.log(`Migrated ${migratedCount} documents`);
      return { count: migratedCount };
      
    } catch (error) {
      console.error('Failed to parse documents from localStorage:', error);
      return { count: 0 };
    }
  }

  /**
   * Migrate current document setting
   */
  async migrateCurrentDocument() {
    const currentDocJson = localStorage.getItem(this.OLD_CURRENT_DOC_KEY);
    if (!currentDocJson) {
      return { migrated: false };
    }

    try {
      const currentDoc = JSON.parse(currentDocJson);
      
      // Save as a setting in IndexedDB
      await indexedDBService.saveSetting('currentDocumentId', currentDoc.id);
      
      console.log('Migrated current document setting');
      return { migrated: true };
      
    } catch (error) {
      console.error('Failed to migrate current document:', error);
      return { migrated: false };
    }
  }

  /**
   * Migrate settings from localStorage
   */
  async migrateSettings() {
    let migratedCount = 0;
    
    for (const settingKey of this.OLD_SETTINGS_KEYS) {
      const settingValue = localStorage.getItem(settingKey);
      if (settingValue) {
        try {
          const parsedValue = JSON.parse(settingValue);
          await indexedDBService.saveSetting(settingKey, parsedValue);
          migratedCount++;
        } catch (error) {
          console.error(`Failed to migrate setting ${settingKey}:`, error);
        }
      }
    }
    
    console.log(`Migrated ${migratedCount} settings`);
    return { count: migratedCount };
  }

  /**
   * Clean up old localStorage data (optional, use with caution)
   */
  async cleanupOldData() {
    const migrationInfo = localStorage.getItem(this.MIGRATION_KEY);
    if (!migrationInfo) {
      console.warn('Migration not completed, skipping cleanup');
      return false;
    }

    try {
      // Remove old document data
      localStorage.removeItem(this.OLD_DOCUMENTS_KEY);
      localStorage.removeItem(this.OLD_CURRENT_DOC_KEY);
      
      // Remove old settings
      this.OLD_SETTINGS_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('Old localStorage data cleaned up');
      return true;
      
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      return false;
    }
  }

  /**
   * Get migration status
   */
  getMigrationStatus() {
    const migrationInfo = localStorage.getItem(this.MIGRATION_KEY);
    if (!migrationInfo) {
      return {
        completed: false,
        needed: this.needsMigration()
      };
    }

    try {
      const info = JSON.parse(migrationInfo);
      return {
        completed: true,
        timestamp: info.timestamp,
        migratedCount: info.migratedCount
      };
    } catch (error) {
      return {
        completed: false,
        needed: this.needsMigration(),
        error: 'Invalid migration info'
      };
    }
  }

  /**
   * Force re-migration (for testing or recovery)
   */
  async forceMigration() {
    localStorage.removeItem(this.MIGRATION_KEY);
    return await this.migrate();
  }

  /**
   * Backup current IndexedDB data to localStorage (for rollback)
   */
  async createBackup() {
    try {
      const documents = await indexedDBService.getAllDocuments();
      const backupData = {
        documents,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      const backupKey = `scai_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      console.log('Backup created:', backupKey);
      return backupKey;
      
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('Backup not found');
      }
      
      const backup = JSON.parse(backupData);
      
      // Clear current data
      await indexedDBService.clearAllData();
      
      // Restore documents
      for (const doc of backup.documents) {
        await indexedDBService.saveDocument(doc);
      }
      
      console.log('Restored from backup:', backupKey);
      return true;
      
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dataMigrationService = new DataMigrationService();

export default dataMigrationService;
