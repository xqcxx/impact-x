import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  DollarSign, 
  Calendar, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { uploadToIPFS, uploadImageToIPFS, type CampaignMetadata, CAMPAIGN_CATEGORIES } from '../lib/ipfs';
import { createCampaign } from '../lib/stacks';
import { RichTextEditor } from '../components/RichTextEditor';

type FormStep = 'details' | 'story' | 'review';

export function CreatePage() {
  const navigate = useNavigate();
  const { connected, stxAddress, connect, refresh } = useStacksWallet();
  
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Refresh wallet state when component mounts or gains focus
  useEffect(() => {
    // Initial refresh
    refresh();
    
    // Refresh when window gains focus
    const handleFocus = () => {
      refresh();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [story, setStory] = useState('');
  const [category, setCategory] = useState('Technology');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('30');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or numeric characters not starting with 0
    if (value === '' || /^[1-9][0-9]*$/.test(value)) {
      setGoal(value);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: FormStep): boolean => {
    if (step === 'details') {
      if (!title.trim()) {
        const msg = 'Please enter a campaign title';
        setError(msg);
        toast.error(msg);
        return false;
      }
      if (!description.trim()) {
        const msg = 'Please enter a description';
        setError(msg);
        toast.error(msg);
        return false;
      }
      if (!goal || parseFloat(goal) < 100) {
        const msg = 'Goal must be at least $100';
        setError(msg);
        toast.error(msg);
        return false;
      }
    }
    if (step === 'story') {
      // Strip HTML tags to check actual text content
      const textContent = story.replace(/<[^>]*>/g, '').trim();
      if (!textContent || textContent.length < 100) {
        const msg = 'Please write a story (at least 100 characters)';
        setError(msg);
        toast.error(msg);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep === 'details') setCurrentStep('story');
    else if (currentStep === 'story') setCurrentStep('review');
  };

  const handleBack = () => {
    if (currentStep === 'story') setCurrentStep('details');
    else if (currentStep === 'review') setCurrentStep('story');
  };

  const handleSubmit = async () => {
    if (!connected || !stxAddress) {
      toast.error('Please connect your Stacks wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const toastId = toast.loading('Creating your campaign...');

      // Upload image if provided
      let imageUrl = 'https://via.placeholder.com/800x400?text=Campaign';
      if (imageFile) {
        toast.loading('Uploading image to IPFS...', { id: toastId });
        imageUrl = await uploadImageToIPFS(imageFile);
      }

      // Create metadata
      const metadata: CampaignMetadata = {
        title,
        description,
        story,
        imageUrl,
        category,
        targetAmount: parseFloat(goal),
        createdAt: Date.now(),
      };

      // Upload to IPFS
      toast.loading('Uploading metadata to IPFS...', { id: toastId });
      const ipfsHash = await uploadToIPFS(metadata);
      console.log('Uploaded to IPFS:', ipfsHash);

      // Create campaign on-chain
      toast.loading('Confirming transaction on wallet...', { id: toastId });
      const result = await createCampaign(
        ipfsHash,
        parseFloat(goal),
        parseInt(duration)
      );

      console.log('Campaign created:', result);
      toast.success('Campaign created successfully!', { id: toastId });
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate('/my-campaigns');
      }, 2000);

    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      const msg = err.message || 'Failed to create campaign';
      setError(msg);
      toast.error(msg);
      toast.dismiss();
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 animate-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success-500/15 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-success-400" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-dark-100 mb-3">Campaign Created!</h1>
        <p className="text-dark-400 mb-4">
          Your campaign is being submitted to the blockchain. 
          Redirecting to your campaigns...
        </p>
        <div className="animate-pulse">
          <Loader2 className="w-6 h-6 text-primary-400 mx-auto animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-dark-100 mb-2">Create a Campaign</h1>
        <p className="text-dark-400">
          Launch your crowdfunding campaign on Stacks and accept donations from Ethereum.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 px-4">
        {(['details', 'story', 'review'] as FormStep[]).map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold transition-all ${
              currentStep === step
                ? 'bg-primary-500 text-dark-900 shadow-lg shadow-primary-500/20'
                : index < ['details', 'story', 'review'].indexOf(currentStep)
                  ? 'bg-success-500/15 text-success-400'
                  : 'bg-white/5 text-dark-500'
            }`}>
              {index < ['details', 'story', 'review'].indexOf(currentStep) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:block ${
              currentStep === step ? 'text-dark-100' : 'text-dark-500'
            }`}>
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </span>
            {index < 2 && (
              <div className={`w-8 sm:w-16 h-px mx-2 sm:mx-4 ${
                index < ['details', 'story', 'review'].indexOf(currentStep)
                  ? 'bg-success-500/30'
                  : 'bg-white/10'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 glass-card border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Step 1: Details */}
      {currentStep === 'details' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Campaign Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your campaign a compelling title"
              className="input"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Short Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your campaign (shown in previews)"
              className="input min-h-[100px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-dark-500 mt-1">{description.length}/200</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1 text-primary-400" />
                Funding Goal (USDC) *
              </label>
              <input
                type="text"
                value={goal}
                onChange={handleGoalChange}
                placeholder="10000"
                className="input"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <Calendar className="w-4 h-4 inline mr-1 text-secondary-400" />
                Duration (days)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input"
              >
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="45">45 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              {CAMPAIGN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1 text-success-400" />
              Campaign Image
            </label>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              imagePreview ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/20 hover:border-primary-500/50'
            }`}>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-10 h-10 text-dark-500 mx-auto mb-3" />
                  <p className="text-dark-300 mb-1">Click to upload image</p>
                  <p className="text-xs text-dark-500">PNG, JPG up to 5MB</p>
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
        </div>
      )}

      {/* Step 2: Story */}
      {currentStep === 'story' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              <FileText className="w-4 h-4 inline mr-1 text-primary-400" />
              Campaign Story *
            </label>
            <p className="text-sm text-dark-500 mb-3">
              Tell potential backers about your project, why it matters, and how you'll use the funds. Use rich formatting to make your story compelling!
            </p>
            
            <RichTextEditor
              value={story}
              onChange={setStory}
              placeholder="Share your story... What problem are you solving? Who will benefit? What's your plan?"
              minHeight="400px"
            />
            
            <p className="text-xs text-dark-500 mt-2">
              {story.replace(/<[^>]*>/g, '').trim().length} characters of content (min 100)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <h4 className="font-heading font-medium text-primary-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Tips for a great story
            </h4>
            <ul className="text-sm text-primary-400/80 space-y-2">
              <li>• Explain the problem you're solving</li>
              <li>• Describe your solution and approach</li>
              <li>• Share your timeline and milestones</li>
              <li>• Introduce your team</li>
              <li>• Be specific about how funds will be used</li>
              <li>• Use headings, bold text, and lists to organize your content</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 'review' && (
        <div className="glass-card p-6 space-y-6">
          <h2 className="text-lg font-heading font-semibold text-dark-100">Review Your Campaign</h2>
          
          <div className="space-y-1">
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-dark-400">Title</span>
              <span className="font-medium text-dark-100">{title}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-dark-400">Category</span>
              <span className="badge-primary">{category}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-dark-400">Funding Goal</span>
              <span className="font-heading font-semibold text-primary-400">${parseInt(goal).toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-dark-400">Duration</span>
              <span className="font-medium text-dark-100">{duration} days</span>
            </div>
            <div className="py-3 border-b border-white/10">
              <span className="text-dark-400 block mb-2">Description</span>
              <p className="text-dark-200">{description}</p>
            </div>
          </div>

          {!connected ? (
            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
              <p className="text-primary-300 mb-4">
                Connect your Stacks wallet to create this campaign.
              </p>
              <button onClick={connect} className="btn-primary">
                Connect Stacks Wallet
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/30">
              <p className="text-success-400">
                Creating as: <strong className="font-mono">{stxAddress?.slice(0, 8)}...{stxAddress?.slice(-4)}</strong>
              </p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-dark-400">
              <strong className="text-dark-200">Platform fee:</strong> 5% of funds raised (only charged on successful campaigns)
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {currentStep !== 'details' ? (
          <button onClick={handleBack} className="btn-secondary">
            Back
          </button>
        ) : (
          <div />
        )}
        
        {currentStep !== 'review' ? (
          <button onClick={handleNext} className="btn-primary">
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !connected}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Launch Campaign
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
