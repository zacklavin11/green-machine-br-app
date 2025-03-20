"use client";

import PageContainer from "../../components/PageContainer";
import UnderConstruction from "../../components/UnderConstruction";

export default function BooksPage() {
  return (
    <PageContainer>
      <UnderConstruction 
        title="Book Library"
        message="We're working on building your book library. Check back soon to browse, upload, and manage your books!"
      />
    </PageContainer>
  );
} 