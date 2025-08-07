import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Alert, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import './ProfilePage.css';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileHtml, setProfileHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // 尝试从localStorage加载profile数据
        const savedProfileData = localStorage.getItem(`scai_profile_${userId}`);
        const savedProfilePageUrl = localStorage.getItem(`scai_profile_page_url_${userId}`);
        
        if (savedProfileData) {
          const profileData = JSON.parse(savedProfileData);
          
          // 如果有已发布的页面URL，尝试从Irys加载
          if (savedProfilePageUrl) {
            try {
              const response = await fetch(savedProfilePageUrl);
              if (response.ok) {
                const html = await response.text();
                setProfileHtml(html);
                setLoading(false);
                return;
              }
            } catch (fetchError) {
              console.warn('Failed to fetch from Irys, falling back to local data:', fetchError);
            }
          }
          
          // 如果没有发布的页面或加载失败，生成本地预览
          const fallbackHtml = generateFallbackProfile(profileData, userId);
          setProfileHtml(fallbackHtml);
        } else {
          setError('Profile not found. The user may not have created a profile yet.');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    } else {
      setError('Invalid profile URL');
      setLoading(false);
    }
  }, [userId]);

  const generateFallbackProfile = (profileData, userId) => {
    const displayName = profileData.displayName || 'User Profile';
    const email = profileData.email || '';
    const bio = profileData.bio || '';
    const institution = profileData.institution || '';
    const position = profileData.position || '';
    const website = profileData.website || '';
    const avatarUrl = profileData.avatarUrl || '';
    const contributions = profileData.contributions || [];
    const researchFields = profileData.researchFields || [];
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayName} - Profile</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            border: 4px solid white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            ${avatarUrl ? `background-image: url('${avatarUrl}'); background-size: cover; background-position: center;` : 'background: #f0f0f0;'}
        }
        .name {
            font-size: 2.5em;
            margin: 0;
            font-weight: 300;
        }
        .title {
            font-size: 1.2em;
            opacity: 0.9;
            margin: 10px 0;
        }
        .content {
            padding: 40px 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h3 {
            color: #1890ff;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .contact-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .contact-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #1890ff;
        }
        .contributions {
            list-style: none;
            padding: 0;
        }
        .contributions li {
            background: #f8f9fa;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #52c41a;
        }
        .research-fields {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .field-tag {
            background: #1890ff;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
        .warning {
            background: #fff7e6;
            border: 1px solid #ffd591;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            color: #d46b08;
        }
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 10px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 20px;
            }
            .name {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="avatar"></div>
            <h1 class="name">${displayName}</h1>
            ${position ? `<div class="title">${position}</div>` : ''}
            ${institution ? `<div class="title">${institution}</div>` : ''}
        </div>
        
        <div class="content">
            <div class="warning">
                ⚠️ This is a local preview. The profile owner hasn't published this page to the decentralized web yet.
            </div>
            
            ${email || website ? `
            <div class="section">
                <h3>Contact Information</h3>
                <div class="contact-info">
                    ${email ? `<div class="contact-item"><strong>Email:</strong> ${email}</div>` : ''}
                    ${website ? `<div class="contact-item"><strong>Website:</strong> <a href="${website}" target="_blank">${website}</a></div>` : ''}
                </div>
            </div>
            ` : ''}
            
            ${bio ? `
            <div class="section">
                <h3>About</h3>
                <p>${bio}</p>
            </div>
            ` : ''}
            
            ${researchFields.length > 0 ? `
            <div class="section">
                <h3>Research Fields</h3>
                <div class="research-fields">
                    ${researchFields.map(field => `<span class="field-tag">${field}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
            ${contributions.length > 0 ? `
            <div class="section">
                <h3>Contributions</h3>
                <ul class="contributions">
                    ${contributions.map(contribution => `<li>${contribution}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
    `;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Spin size="large" />
          <div style={{ marginTop: '20px', fontSize: '16px' }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          width: '100%',
          background: 'white',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <Alert
            message="Profile Not Found"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
          <Button 
            type="primary" 
            icon={<HomeOutlined />}
            onClick={() => navigate('/app/search')}
            size="large"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <div dangerouslySetInnerHTML={{ __html: profileHtml }} />
    </div>
  );
};

export default ProfilePage;