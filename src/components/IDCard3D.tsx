import React, { useState } from 'react';
import Barcode from 'react-barcode';

interface Student {
  id: string;
  name: string;
  matric_number: string;
  department: string;
  level: string;
  photo_url?: string;
}

interface IDCard3DProps {
  student: Student;
  forceSide?: 'front' | 'back';
}

const IDCard3D: React.FC<IDCard3DProps> = ({ student, forceSide }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (!forceSide) {
      setIsFlipped(!isFlipped);
    }
  };

  const currentYear = new Date().getFullYear();
  const validityYear = currentYear + 1;

  // Front Face Component
  const FrontFace = () => (
    <div className="id-card-container">
      <div className="id-card-bg-pattern" />
      
      <div className="id-card-header">
        <h1 style={{ color: '#ffffff' }} className="text-[18px] font-extrabold m-0 p-0 tracking-tight leading-tight">
          MOUNTAIN TOP UNIVERSITY
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }} className="text-[10px] font-medium m-0 p-0 tracking-[2px] uppercase">
          Student Identity Card
        </p>
      </div>

      <div className="id-card-body">
        <div className="id-card-left">
          <div className="id-photo-wrapper">
            {student.photo_url ? (
              <img 
                src={student.photo_url} 
                alt={student.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#e2e8f0] text-[#94a3b8]">

                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="id-card-right">
          <div className="id-detail-row id-name-row">
            <span className="id-detail-label">Name</span>
            <span className="id-detail-value">{student.name}</span>
          </div>
          <div className="id-detail-row">
            <span className="id-detail-label">Matric No</span>
            <span className="id-detail-value">{student.matric_number}</span>
          </div>
          <div className="id-detail-row">
            <span className="id-detail-label">Department</span>
            <span className="id-detail-value">{student.department}</span>
          </div>
          <div className="id-detail-row">
            <span className="id-detail-label">Level</span>
            <span className="id-detail-value">{student.level}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Back Face Component
  const BackFace = () => (
    <div className="id-card-back">
      <div className="id-card-back-content">
        <p className="id-back-text-sm">
          This card remains the property of Mountain Top University.
          It is non-transferable and must be presented on demand.
        </p>
        
        <div className="id-back-banner">
          MOUNTAIN TOP UNIVERSITY
        </div>

        <p className="id-back-text-sm">
          This card must be in owner's possession within the University premises.
          Loss of this card must be reported immediately to the Registry.
        </p>

        <p className="id-back-return uppercase tracking-wider">
          If found, please return to:
        </p>
        <p className="text-[12px] text-[#475569] font-medium -mt-2">
          Registry Department / Mountain Top University
        </p>

        <div className="mt-2 flex flex-col items-center gap-1">
          <span className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest">Valid For Session</span>
          <span className="id-back-validity">{currentYear} / {validityYear}</span>
        </div>

        <div className="mt-2 bg-white p-1 rounded-sm shadow-sm border border-[#f1f5f9]">
          <Barcode 
            value={window.location.origin + "/verify/" + student.matric_number}
            width={0.7}
            height={35}
            displayValue={false}
            margin={0}
            lineColor="#000000"
            background="#ffffff"
          />
        </div>
      </div>
    </div>
  );

  if (forceSide === 'front') return <FrontFace />;
  if (forceSide === 'back') return <BackFace />;

  return (
    <div className="id-card-scene" onClick={handleFlip}>
      <div className={`id-card-inner ${isFlipped ? 'flipped' : ''}`}>
        <FrontFace />
        <BackFace />
      </div>
    </div>
  );
};

export default IDCard3D;
