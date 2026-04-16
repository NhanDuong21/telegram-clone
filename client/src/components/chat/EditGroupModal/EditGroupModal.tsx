import React, { useState, useRef } from 'react';
import { Camera, Smile, History, Users, Shield, Activity, X, ChevronRight, ArrowLeft, Trash2 } from 'lucide-react';
import './EditGroupModal.css';
import type { Conversation, User } from '../../../types/chat';
import { updateGroupSettingsApi, deleteGroupApi, uploadImageApi } from '../../../api/chatApi';
import ConfirmModal from '../../common/ConfirmModal';
import AvatarCropperModal from '../../common/AvatarCropperModal';
import toast from 'react-hot-toast';

interface EditGroupModalProps {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onGroupUpdated: (conversation: Conversation) => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ conversation, currentUserId, onClose, onGroupUpdated }) => {
  const [activeView, setActiveView] = useState<'main' | 'admins' | 'members'>('main');

  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [showHistory, setShowHistory] = useState(conversation.showHistoryForNewMembers ?? true);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);

  // Avatar state: deferred upload
  const [localPreview, setLocalPreview] = useState(conversation.imageUrl || '');
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  const isOwner = conversation.owner === currentUserId;
  const adminCount = 1; 
  const memberCount = conversation.participants?.length || 0;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Step 1: File selected → read as DataURL → open cropper (NO upload here!)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Step 2: Crop done → save blob locally, show preview (still NO upload!)
  const handleCropDone = (croppedBlob: Blob, previewUrl: string) => {
    setPendingAvatarBlob(croppedBlob);
    setLocalPreview(previewUrl);
    setCropperSrc(null);
  };

  // Step 3: "Lưu" button → upload to Cloudinary THEN update settings
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Tên nhóm không được để trống');
      return;
    }

    try {
      setIsUploading(true);

      let finalImageUrl = conversation.imageUrl || '';

      // Upload cropped avatar if user selected a new one
      if (pendingAvatarBlob) {
        const avatarFile = new File([pendingAvatarBlob], 'group-avatar.jpg', { type: 'image/jpeg' });
        const uploadRes = await uploadImageApi(avatarFile);
        finalImageUrl = uploadRes.data.imageUrl;
      }

      const res = await updateGroupSettingsApi(conversation._id, {
        name,
        description,
        showHistoryForNewMembers: showHistory,
        imageUrl: finalImageUrl,
      });
      onGroupUpdated(res.data.conversation);
      toast.success('Cập nhật thông tin nhóm thành công');
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Không thể cập nhật thông tin nhóm');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteGroup = async () => {
    setConfirmDeleteGroup(true);
  };

  const executeDeleteGroup = async () => {
    setConfirmDeleteGroup(false);
    try {
      await deleteGroupApi(conversation._id);
      toast.success('Nhóm đã bị xóa vĩnh viễn');
      onClose();
    } catch (error) {
      console.error('Delete group failed:', error);
      toast.error('Không thể xóa nhóm');
    }
  };

  // --- SUB-VIEWS ---
  if (activeView === 'admins') {
    return (
      <div className="edit-group-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="edit-group-modal" onClick={e => e.stopPropagation()}>
          <div className="edit-group-header">
            <button className="edit-group-close" onClick={() => setActiveView('main')}>
              <ArrowLeft size={20} />
            </button>
            <h2>Quản trị viên</h2>
          </div>
          <div className="edit-group-body list-view-body">
            {conversation.participants?.filter((p: User) => p._id === conversation.owner).map((p: User) => (
              <div key={p._id} className="sub-list-item">
                <div className="sub-list-avatar">
                   {p.avatar ? <img src={p.avatar} alt="Admin" /> : <div className="avatar-placeholder">{p.fullName?.charAt(0) || p.username.charAt(0)}</div>}
                </div>
                <div className="sub-list-info">
                   <span className="sub-list-name">{p.fullName || p.username}</span>
                   <span className="sub-list-role">Chủ sở hữu</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'members') {
    return (
      <div className="edit-group-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="edit-group-modal" onClick={e => e.stopPropagation()}>
          <div className="edit-group-header">
            <button className="edit-group-close" onClick={() => setActiveView('main')}>
              <ArrowLeft size={20} />
            </button>
            <h2>Thành viên</h2>
          </div>
          <div className="edit-group-body list-view-body">
            {conversation.participants?.map((p: User) => {
               const isPOwner = p._id === conversation.owner;
               return (
                <div key={p._id} className="sub-list-item">
                  <div className="sub-list-avatar">
                     {p.avatar ? <img src={p.avatar} alt="Member" /> : <div className="avatar-placeholder">{p.fullName?.charAt(0) || p.username.charAt(0)}</div>}
                  </div>
                  <div className="sub-list-info">
                     <span className="sub-list-name">{p.fullName || p.username}</span>
                     {isPOwner ? <span className="sub-list-role">Chủ sở hữu</span> : <span className="sub-list-role">Thành viên</span>}
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-group-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !cropperSrc) onClose(); }}>
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
              {localPreview ? (
                <img src={localPreview} alt="Group Avatar" />
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

            <button className="edit-menu-item" onClick={() => setActiveView('admins')}>
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

            <button className="edit-menu-item" onClick={() => setActiveView('members')}>
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

            {isOwner && (
              <>
                <div className="edit-group-separator" style={{ height: '8px' }}></div>
                <button className="edit-menu-item edit-menu-item-danger" onClick={handleDeleteGroup}>
                  <div className="edit-menu-item-left">
                    <div className="edit-menu-item-icon text-red">
                      <Trash2 size={20} />
                    </div>
                    <div className="edit-menu-item-text text-red">
                      Xóa nhóm vĩnh viễn
                    </div>
                  </div>
                </button>
              </>
            )}
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
            {isUploading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
    </div>

      {confirmDeleteGroup && (
        <ConfirmModal
          title="Xóa nhóm vĩnh viễn"
          message="Bạn có chắc chắn muốn xóa nhóm vĩnh viễn? Hành động này không thể hoàn tác và sẽ xóa toàn bộ tin nhắn."
          confirmLabel="Xóa vĩnh viễn"
          isDanger
          onConfirm={executeDeleteGroup}
          onCancel={() => setConfirmDeleteGroup(false)}
        />
      )}

      {cropperSrc && (
        <AvatarCropperModal
          imageSrc={cropperSrc}
          onCancel={() => setCropperSrc(null)}
          onCropDone={handleCropDone}
        />
      )}
    </div>
  );
};

export default EditGroupModal;

