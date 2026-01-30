import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Loader2, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { updateCampaignMetadata } from '../lib/stacks';
import { uploadToIPFS, uploadImageToIPFS, type CampaignMetadata } from '../lib/ipfs';
import { RichTextEditor } from './RichTextEditor';

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: number;
    title: string;
    description: string;
    story: string;
    imageUrl: string;
    category: string;
    goal: number;
  };
  onSuccess?: () => void;
}

export function EditCampaignModal({
  isOpen,
  onClose,
  campaign,
  onSuccess,
}: EditCampaignModalProps) {
  const [description, setDescription] = useState(campaign.description);
  const [story, setStory] = useState(campaign.story);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(campaign.imageUrl);
  const [loading, setLoading] = useState(false);

  const { connected } = useStacksWallet();

  useEffect(() => {
    if (isOpen) {
      setDescription(campaign.description);
      setStory(campaign.story);
      setImagePreview(campaign.imageUrl);
      setImageFile(null);
    }
  }, [isOpen, campaign]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!connected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!description.trim() || !story.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Updating campaign...');

    try {
      let imageUrl = campaign.imageUrl;
      
      // Upload new image if selected
      if (imageFile) {
        toast.loading('Uploading new image...', { id: toastId });
        imageUrl = await uploadImageToIPFS(imageFile);
      }

      // Create new metadata
      const metadata: CampaignMetadata = {
        title: campaign.title, // Title cannot be changed on-chain usually, but metadata can be updated
        description,
        story,
        imageUrl,
        category: campaign.category,
        targetAmount: campaign.goal,
        createdAt: Date.now(), // Updated timestamp
      };

      // Upload to IPFS
      toast.loading('Uploading metadata to IPFS...', { id: toastId });
      const ipfsHash = await uploadToIPFS(metadata);

      // Update on-chain
      toast.loading('Confirming transaction...', { id: toastId });
      const result = await updateCampaignMetadata(campaign.id, ipfsHash);

      console.log('Update result:', result);
      toast.success('Campaign updated successfully!', { id: toastId });
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Update failed:', err);
      toast.error(err.message || 'Failed to update campaign', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-dark-900/80 backdrop-blur-md"
        onClick={loading ? undefined : onClose}
      />
      
      <div className="glass-card relative max-w-2xl w-full max-h-[90vh] flex flex-col animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-heading font-semibold text-dark-100">
            Edit Campaign
          </h2>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Short Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px] resize-none"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1 text-success-400" />
              Campaign Image
            </label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              imagePreview ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/20 hover:border-primary-500/50'
            }`}>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                  <label className="absolute bottom-2 right-2 bg-dark-900/80 p-2 rounded-lg cursor-pointer hover:bg-dark-800">
                    <Upload className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                  <p className="text-sm text-dark-300">Click to upload new image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Story
            </label>
            <RichTextEditor
              value={story}
              onChange={setStory}
              minHeight="200px"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}