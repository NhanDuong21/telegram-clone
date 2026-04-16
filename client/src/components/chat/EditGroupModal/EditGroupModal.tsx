import React, { useState, useRef } from 'react';
import { Camera, Smile, History, Users, Link as LinkIcon, Shield, Activity, X, ChevronRight, MessageSquareHeart } from 'lucide-react';
import './EditGroupModal.css';
import type { Conversation } from '../../../types/chat';
import { updateGroupSettingsApi } from '../../../api/chatApi';
import toast from 'react-hot-toast';

interface EditGroupModalProps {
  conversation: Conversation;
  onClose: () => void;
  onGroupUpdated: (conversation: Conversation) => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ conversation, onClose, onGroupUpdated }) => {
  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [showHistory, setShowHistory] = useState(conversation.showHistoryForNewMembers ?? true);
  const [imageUrl, setImageUrl] = useState(conversation.imageUrl || '');
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminCount = 1; // Assuming owner is the only admin for now
  const memberCount = conversation.participants?.length || 0;

  // Permissions count (just mocked display based on object)
  const perms = conversation.permissions || {};
  const activePermsCount = Object.values(perms).filter(Boolean).length;
  // Let's assume 14 total permissions in fake Telegram, but our DB holds only 5. Let's just hardcode "9/14" or calculate 
  const displayPermsCount = `${activePermsCount + 4}/14`; // mock to look like telegram 

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    try {
      setIsUploading(true);
      // Simulate file upload or use existing upload handler that belongs to another module.
      // Usually, there is an upload handler logic here, but since messageApi is missing,
      // we just show a toast reminder.
      setTimeout(() => {
         toast.error('Chức năng tải ảnh lên cần được cấu hình Backend.');
         setIsUploading(false);
      }, 500);
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error('Lỗi khi tải ảnh lên');
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Tên nhóm không được để trống');
      return;
    }

    try {
      const res = await updateGroupSettingsApi(conversation._id, {
        name,
        description,
        showHistoryForNewMembers: showHistory,
        imageUrl,
      });
      onGroupUpdated(res.data.conversation);
      toast.success('Cập nhật thông tin nhóm thành công');
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Không thể cập nhật thông tin nhóm');
    }
  };

  return (
    <div className="edit-group-overlay" onClick={onClose}>
      <div className="edit-group-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-group-header">
          <button className="edit-group-close" onClick={onClose}>
            <X size={20} />
          </button>
          <h2>Sửa</h2>
        </div>

        <div className="edit-group-body">
          {/* Avatar and inputs */}
          <div className="edit-group-hero">
            <div className="avatar-upload-container" onClick={handleAvatarClick}>
              {imageUrl ? (
                <img src={imageUrl} alt="Group Avatar" />
              ) : (
                <Camera size={24} color="#FFF" />
              )}
              <div className="avatar-upload-overlay">
                <Camera size={24} color="#FFF" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            <div className="edit-group-inputs">
              <div className="edit-input-wrapper">
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Tên nhóm" 
                  maxLength={50}
                />
                <button className="input-emoji-btn">
                  <Smile size={20} />
                </button>
              </div>
              <input 
                type="text" 
                className="edit-group-desc" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Mô tả (tùy chọn)" 
              />
            </div>
          </div>

          <div className="edit-group-separator"></div>

          {/* Settings List */}
          <div className="edit-menu-list">
            <button className="edit-menu-item" onClick={() => setShowHistory(!showHistory)}>
              <div className="edit-menu-item-left">
                <div className="edit-menu-item-icon">
                  <History size={20} />
                </div>
                <div className="edit-menu-item-text">
                  Lịch sử trò chuyện cho thành viên mới
                  <div className="edit-menu-item-subtext">
                    {showHistory ? 'Hiện' : 'Ẩn'}
                  </div>
                </div>
              </div>
              <div className="edit-menu-item-right">
                <ChevronRight size={20} />
              </div>
            </button>
            
            <div className="edit-group-separator" style={{ height: '8px' }}></div>

            <button className="edit-menu-item">
              <div className="edit-menu-item-left">
                <div className="edit-menu-item-icon">
                  <MessageSquareHeart size={20} />
                </div>
                <div className="edit-menu-item-text">
                  Biểu tượng cảm xúc
                </div>
              </div>
              <div className="edit-menu-item-right">
                <span className="edit-menu-item-right-value">9/73</span>
                <ChevronRight size={20} />
              </div>
            </button>

            <button className="edit-menu-item">
              <div className="edit-menu-item-left">
                <div className="edit-menu-item-icon">
                  <Shield size={20} />
                </div>
                <div className="edit-menu-item-text">
                  Quyền
                </div>
              </div>
              <div className="edit-menu-item-right">
                <span className="edit-menu-item-right-value">{displayPermsCount}</span>
                <ChevronRight size={20} />
              </div>
            </button>

            <button className="edit-menu-item">
              <div className="edit-menu-item-left">
                <div className="edit-menu-item-icon">
                  <LinkIcon size={20} />
                </div>
                <div className="edit-menu-item-text">
                  Liên kết mời
                </div>
              </div>
              <div className="edit-menu-item-right">
                <span>0</span>
                <ChevronRight size={20} />
              </div>
            </button>

            <div className="edit-group-separator" style={{ height: '8px' }}></div>

            <button className="edit-menu-item">
              <div className="edit-menu-item-left">
                <div className="edit-menu-item-icon">
                  <Shield size={20} />
                </div>
                <div className="edit-menu-item-text">
                  Quản trị viên
                </div>
              </div>
              <div className="edit-menu-item-right">
                <span>{adminCount}</span>
                <ChevronRight size={20} />
              </div>
            </button>

            <button className="edit-menu-item">
              <div className="edit-menu-item-left">
                <div className="edit-menu-item-icon">
                  <Users size={20} />
                </div>
                <div className="edit-menu-item-text">
                  Thành viên
                </div>
              </div>
              <div className="edit-menu-item-right">
                <span>{memberCount}</span>
                <ChevronRight size={20} />
              </div>
            </button>

            <div className="edit-group-separator" style={{ height: '8px' }}></div>

            <button className="edit-menu-item">
              <div className="edit-menu-item-left">
                <div className="edit-menu-item-icon">
                  <Activity size={20} />
                </div>
                <div className="edit-menu-item-text">
                  Hành động gần đây
                </div>
              </div>
              <div className="edit-menu-item-right">
                <ChevronRight size={20} />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="edit-group-footer">
          <button className="edit-footer-btn btn-cancel" onClick={onClose}>Bỏ qua</button>
          <button 
            className="edit-footer-btn btn-save" 
            onClick={handleSave}
            disabled={isUploading}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;
