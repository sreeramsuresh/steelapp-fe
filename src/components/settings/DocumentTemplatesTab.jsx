import { useEffect, useState } from "react";
import { useApiData } from "../../hooks/useApi";
import { companyService } from "../../services/companyService";
import { notificationService } from "../../services/notificationService";
import InvoiceTemplateSettings from "../InvoiceTemplateSettings";

const DocumentTemplatesTab = () => {
  const { data: companyData } = useApiData(companyService.getCompany, []);

  const [companyProfile, setCompanyProfile] = useState(null);

  useEffect(() => {
    if (companyData) {
      setCompanyProfile(companyData);
    }
  }, [companyData]);

  if (!companyProfile) {
    return <div className="p-6 text-center text-gray-500">Loading template settings...</div>;
  }

  return (
    <InvoiceTemplateSettings
      company={companyProfile}
      onSave={async (templateSettings) => {
        try {
          const updatedProfile = {
            ...companyProfile,
            settings: {
              ...companyProfile.settings,
              invoiceTemplate: templateSettings.invoiceTemplate,
              documentTemplates: templateSettings.documentTemplates,
            },
          };

          await companyService.updateCompany(updatedProfile);
          setCompanyProfile(updatedProfile);
          notificationService.success("Invoice template settings saved successfully!");
        } catch (error) {
          console.error("Error saving template settings:", error);
          notificationService.error("Failed to save template settings");
          throw error;
        }
      }}
    />
  );
};

export default DocumentTemplatesTab;
