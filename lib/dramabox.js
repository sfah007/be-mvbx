import axios from 'axios';
import { generateDeviceId, generateToken, getHeaders } from './token.js';

const DRAMABOX_API = "https://sapi.dramaboxdb.com";
const FALLBACK_API = "https://dramabox.sansekai.my.id/api/dramabox";

let cachedToken = null;
let tokenExpiry = 0;

function getValidToken() {
  const now = Date.now();
  if (!cachedToken || now > tokenExpiry) {
    const deviceId = generateDeviceId();
    cachedToken = generateToken(deviceId);
    tokenExpiry = now + (30 * 60 * 1000);
  }
  return cachedToken;
}

async function makeDirectRequest(endpoint, data, method = 'POST') {
  const token = getValidToken();
  const headers = getHeaders(token);
  
  try {
    const config = {
      method,
      url: `${DRAMABOX_API}${endpoint}`,
      headers,
      timeout: 15000
    };
    
    if (method === 'POST') {
      config.data = data;
    } else {
      config.params = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Direct API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

async function makeFallbackRequest(endpoint) {
  try {
    const response = await axios.get(`${FALLBACK_API}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    console.error(`Fallback API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export async function getTrending(pageNo = 1) {
  try {
    const data = {
      newChannelStyle: 1,
      isNeedRank: 1,
      pageNo: pageNo,
      index: 1,
      channelId: 43
    };
    
    const result = await makeDirectRequest('/drama-box/he001/theater', data);
    
    if (result?.data?.newTheaterList?.records) {
      return result.data.newTheaterList.records.map(item => ({
        bookId: item.bookId,
        bookName: item.bookName,
        coverWap: item.coverWap || item.cover,
        introduction: item.introduction,
        tags: item.tags || [],
        chapterCount: item.chapterCount || item.totalChapter,
        rankVo: item.rankVo
      }));
    }
  } catch (directError) {
    console.log('Direct API failed, trying fallback...');
  }
  
  try {
    const fallbackData = await makeFallbackRequest('/trending');
    if (Array.isArray(fallbackData)) {
      return fallbackData;
    }
    return [];
  } catch (fallbackError) {
    console.error('Both APIs failed for trending');
    return [];
  }
}

export async function getLatest(pageNo = 1) {
  try {
    const data = {
      newChannelStyle: 1,
      isNeedRank: 0,
      pageNo: pageNo,
      index: 1,
      channelId: 48
    };
    
    const result = await makeDirectRequest('/drama-box/he001/theater', data);
    
    if (result?.data?.newTheaterList?.records) {
      return result.data.newTheaterList.records.map(item => ({
        bookId: item.bookId,
        bookName: item.bookName,
        coverWap: item.coverWap || item.cover,
        introduction: item.introduction,
        tags: item.tags || [],
        chapterCount: item.chapterCount || item.totalChapter
      }));
    }
  } catch (directError) {
    console.log('Direct API failed, trying fallback...');
  }
  
  try {
    const fallbackData = await makeFallbackRequest('/latest');
    if (Array.isArray(fallbackData)) {
      return fallbackData;
    }
    return [];
  } catch (fallbackError) {
    console.error('Both APIs failed for latest');
    return [];
  }
}

export async function search(keyword) {
  try {
    const data = {
      keyword: keyword
    };
    
    const result = await makeDirectRequest('/drama-box/search/suggest', data);
    
    if (result?.data?.suggestList) {
      return result.data.suggestList.map(item => ({
        bookId: item.bookId,
        bookName: item.bookName,
        coverWap: item.coverWap || item.cover,
        introduction: item.introduction,
        tags: item.tags || [],
        chapterCount: item.chapterCount || item.totalChapter
      }));
    }
  } catch (directError) {
    console.log('Direct API failed, trying fallback...');
  }
  
  try {
    const fallbackData = await makeFallbackRequest(`/search?query=${encodeURIComponent(keyword)}`);
    if (Array.isArray(fallbackData)) {
      return fallbackData;
    }
    return [];
  } catch (fallbackError) {
    console.error('Both APIs failed for search');
    return [];
  }
}

export async function getStream(bookId, episode = 1) {
  try {
    const data = {
      boundaryIndex: 0,
      comingPlaySectionId: -1,
      index: episode,
      currencyPlaySource: "discover_new_rec_new",
      needEndRecommend: 0,
      currencyPlaySourceName: "",
      preLoad: false,
      rid: "",
      pullCid: "",
      loadDirection: 0,
      startUpKey: "",
      bookId: bookId
    };
    
    const result = await makeDirectRequest('/drama-box/chapterv2/batch/load', data);
    
    if (result?.data?.chapterList) {
      const chapters = result.data.chapterList;
      const targetChapter = chapters.find(ch => ch.chapterIndex === episode - 1) || chapters[0];
      
      if (targetChapter) {
        const cdnList = targetChapter.cdnList || [];
        const videoUrl = cdnList[0]?.videoPath || cdnList[0]?.url || '';
        
        return {
          bookId: bookId,
          episode: episode,
          chapterIndex: targetChapter.chapterIndex,
          videoUrl: videoUrl,
          cover: targetChapter.cover || '',
          qualities: cdnList.map(cdn => ({
            quality: cdn.quality || 720,
            videoPath: cdn.videoPath || cdn.url,
            isDefault: cdn.isDefault || 0
          })),
          totalEpisodes: chapters.length
        };
      }
    }
  } catch (directError) {
    console.log('Direct API failed, trying fallback...');
  }
  
  try {
    const fallbackData = await makeFallbackRequest(`/stream?bookId=${bookId}&episode=${episode}`);
    if (fallbackData && fallbackData.videoUrl) {
      return fallbackData;
    }
    return null;
  } catch (fallbackError) {
    console.error('Both APIs failed for stream');
    return null;
  }
}

export default { getTrending, getLatest, search, getStream };
