"use client";

import PageContainer from "../../../components/PageContainer";
import UnderConstruction from "../../../components/UnderConstruction";

export default function NewBookPage() {
  return (
    <PageContainer>
      <UnderConstruction 
        title="Add New Book"
        message="This feature is coming soon. You'll be able to upload books and start tracking your reading progress!"
        backLink="/books"
        backText="Back to Books"
      />
    </PageContainer>
  );
} 