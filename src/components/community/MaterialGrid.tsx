import React from 'react';
import { CommunityMaterial } from '../../hooks/useCommunityMaterials';
import { MaterialCard } from './MaterialCard';

interface MaterialGridProps {
  materials: CommunityMaterial[];
  onPreview: (material: CommunityMaterial) => void;
  onClone: (material: CommunityMaterial) => void;
}

export function MaterialGrid({ materials, onPreview, onClone }: MaterialGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
      {materials.map((m) => (
        <MaterialCard
          key={m.id}
          material={m}
          onPreview={onPreview}
          onClone={onClone}
        />
      ))}
    </div>
  );
}
