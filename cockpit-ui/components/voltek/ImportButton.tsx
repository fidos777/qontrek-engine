// components/voltek/ImportButton.tsx
// Button to trigger the import wizard modal

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ImportWizardModal } from "./ImportWizardModal";

export const ImportButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setIsModalOpen(true)}>
        Import Voltek Projects
      </Button>

      <ImportWizardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default ImportButton;
