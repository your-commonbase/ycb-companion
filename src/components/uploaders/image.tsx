/* eslint-disable react/no-array-index-key */

'use client';

// import { useUser } from '@clerk/nextjs';

import { useRouter } from 'next/navigation';

import ImageUpload from '../ImageUpload';

interface UploaderProps {
  closeModal: () => void;
}

const Uploader = ({ closeModal }: UploaderProps) => {
  const router = useRouter();

  const handleUploadComplete = (result: any) => {
    router.push(`/dashboard/entry/${result.id}`);
  };

  return (
    <div className="[&_p]:my-6">
      <button onClick={closeModal} type="button">
        (close)
      </button>
      <ImageUpload metadata={{}} onUploadComplete={handleUploadComplete} />
    </div>
  );
};

export default Uploader;
