// User uploaded fulltext management tool
// Manages full-text documents uploaded by users for papers

const FULLTEXT_STORAGE_KEY = 'scai_user_fulltexts';

// 獲取所有用戶上傳的fulltext
export const getUserFulltexts = () => {
  try {
    const fulltexts = localStorage.getItem(FULLTEXT_STORAGE_KEY);
    return fulltexts ? JSON.parse(fulltexts) : {};
  } catch (error) {
    console.error('Error getting user fulltexts:', error);
    return {};
  }
};

// 保存用戶上傳的fulltext
export const saveUserFulltext = (doi, fulltextData) => {
  try {
    const fulltexts = getUserFulltexts();
    fulltexts[doi] = {
      ...fulltextData,
      uploadDate: new Date().toISOString(),
    };
    localStorage.setItem(FULLTEXT_STORAGE_KEY, JSON.stringify(fulltexts));

    // 觸發fulltext更新事件，通知其他組件
    window.dispatchEvent(new CustomEvent('fulltextUpdated', { detail: { doi } }));

    return true;
  } catch (error) {
    console.error('Error saving user fulltext:', error);
    return false;
  }
};

// 檢查DOI是否有用戶上傳的fulltext
export const hasUserFulltext = (doi) => {
  if (!doi) return false;

  const fulltexts = getUserFulltexts();
  return !!fulltexts[doi];
};

// 獲取特定DOI的fulltext信息
export const getUserFulltextInfo = (doi) => {
  if (!doi) return null;

  const fulltexts = getUserFulltexts();
  return fulltexts[doi] || null;
};

// 刪除用戶上傳的fulltext
export const removeUserFulltext = (doi, userId) => {
  try {
    const fulltexts = getUserFulltexts();
    const fulltextData = fulltexts[doi];

    // 檢查權限：只有上傳者可以刪除
    if (fulltextData && fulltextData.userId === userId) {
      delete fulltexts[doi];
      localStorage.setItem(FULLTEXT_STORAGE_KEY, JSON.stringify(fulltexts));

      // 觸發fulltext更新事件
      window.dispatchEvent(new CustomEvent('fulltextUpdated', { detail: { doi } }));

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error removing user fulltext:', error);
    return false;
  }
};

// 獲取用戶上傳的所有fulltext（按用戶ID過濾）
export const getUserFulltextsByUserId = (userId) => {
  try {
    const fulltexts = getUserFulltexts();
    const userFulltexts = {};

    Object.entries(fulltexts).forEach(([doi, data]) => {
      if (data.userId === userId) {
        userFulltexts[doi] = data;
      }
    });

    return userFulltexts;
  } catch (error) {
    console.error('Error getting user fulltexts by user ID:', error);
    return {};
  }
};

// 清理過期的fulltext（可選功能）
export const cleanupExpiredFulltexts = (daysToKeep = 365) => {
  try {
    const fulltexts = getUserFulltexts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let hasChanges = false;
    Object.entries(fulltexts).forEach(([doi, data]) => {
      const uploadDate = new Date(data.uploadDate);
      if (uploadDate < cutoffDate) {
        delete fulltexts[doi];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(FULLTEXT_STORAGE_KEY, JSON.stringify(fulltexts));
    }

    return hasChanges;
  } catch (error) {
    console.error('Error cleaning up expired fulltexts:', error);
    return false;
  }
};

// 統計用戶上傳的fulltext數量
export const getUserFulltextCount = (userId) => {
  const userFulltexts = getUserFulltextsByUserId(userId);
  return Object.keys(userFulltexts).length;
};
