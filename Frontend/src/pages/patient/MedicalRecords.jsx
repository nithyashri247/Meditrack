import {
  Archive,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  Filter,
  FolderOpen,
  Info,
  LoaderCircle,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

/* =========================================================
   RECORD CONFIGURATION
   ========================================================= */

const CATEGORIES = {
  lab_report: {
    label: "Lab reports",
    shortLabel: "Lab Report",
    icon: FileText,
  },

  scan: {
    label: "Scans & imaging",
    shortLabel: "Scan / Imaging",
    icon: FileImage,
  },

  prescription: {
    label: "Prescriptions",
    shortLabel: "Prescription",
    icon: FileText,
  },

  discharge_summary: {
    label: "Discharge summaries",
    shortLabel: "Discharge Summary",
    icon: FileText,
  },

  consultation: {
    label: "Consultation",
    shortLabel: "Consultation",
    icon: FileText,
  },

  vaccination: {
    label: "Vaccination",
    shortLabel: "Vaccination",
    icon: FileText,
  },

  other: {
    label: "Other documents",
    shortLabel: "Other",
    icon: FileText,
  },
};

const ACCEPTED_FILES =
  ".pdf,.jpg,.jpeg,.png,.webp";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getFileIcon(mimeType) {
  if (
    mimeType?.startsWith(
      "image/"
    )
  ) {
    return FileImage;
  }

  return FileText;
}

function getInitialForm() {
  return {
    title: "",
    category: "lab_report",
    doctorName: "",
    hospitalName: "",
    documentDate: "",
    description: "",
    visibility: "private",
  };
}

/* =========================================================
   COMPONENT
   ========================================================= */

function MedicalRecords() {
  const navigate = useNavigate();

  const fileInputRef =
    useRef(null);

  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [showUploadModal, setShowUploadModal] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [form, setForm] =
    useState(getInitialForm());

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState("");

  const [archivingId, setArchivingId] =
    useState("");

  const [activeMenu, setActiveMenu] =
    useState(null);

  const [preview, setPreview] =
    useState(null);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  /*
   * Load records on page entry.
   */

  useEffect(() => {
    loadRecords();
  }, []);

  /*
   * Close three-dot menu if user clicks elsewhere.
   */

  useEffect(() => {
    function handleDocumentClick() {
      setActiveMenu(null);
    }

    if (activeMenu) {
      document.addEventListener(
        "click",
        handleDocumentClick
      );
    }

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClick
      );
    };
  }, [activeMenu]);

  async function loadRecords() {
    try {
      setError("");

      const response =
        await api.get(
          "/medical-records"
        );

      setRecords(
        response.data?.data || []
      );
    } catch (err) {
      console.error(
        "Load records error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load your medical records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshRecords() {
    setRefreshing(true);
    setSuccess("");
    await loadRecords();
  }

  function openUploadModal() {
    setForm(
      getInitialForm()
    );

    setSelectedFile(null);
    setError("");
    setSuccess("");

    setShowUploadModal(true);
  }

  function closeUploadModal() {
    if (uploading) {
      return;
    }

    setShowUploadModal(false);
    setSelectedFile(null);
    setForm(
      getInitialForm()
    );

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  function updateForm(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  }

  function handleFileChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    setError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setSelectedFile(null);

      event.target.value = "";

      setError(
        "The selected file is larger than the 10 MB limit."
      );

      return;
    }

    const extension =
      `.${file.name
        .split(".")
        .pop()
        ?.toLowerCase()}`;

    const allowedExtensions = [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      setSelectedFile(null);

      event.target.value = "";

      setError(
        "Please choose a PDF, JPG, JPEG, PNG or WEBP file."
      );

      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(
    event
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.title.trim()
    ) {
      setError(
        "Please enter a document title."
      );
      return;
    }

    if (!form.category) {
      setError(
        "Please select a document category."
      );
      return;
    }

    if (!selectedFile) {
      setError(
        "Please select a medical document."
      );
      return;
    }

    try {
      setUploading(true);

      const data =
        new FormData();

      data.append(
        "medicalDocument",
        selectedFile
      );

      data.append(
        "title",
        form.title.trim()
      );

      data.append(
        "category",
        form.category
      );

      data.append(
        "doctorName",
        form.doctorName.trim()
      );

      data.append(
        "hospitalName",
        form.hospitalName.trim()
      );

      data.append(
        "documentDate",
        form.documentDate
      );

      data.append(
        "description",
        form.description.trim()
      );

      data.append(
        "visibility",
        form.visibility
      );

      const response =
  await api.post(
    "/medical-records/upload",
    data
  );

      const uploadedRecord =
        response.data?.data;

      if (uploadedRecord) {
        setRecords(
          (previous) => [
            uploadedRecord,
            ...previous,
          ]
        );
      }

      setSuccess(
        "Medical document uploaded successfully."
      );

      closeUploadModal();
    } catch (err) {
      console.error(
        "Upload medical record error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to upload the medical document."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(
    recordId
  ) {
    const confirmed =
      window.confirm(
        "Delete this medical record permanently?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(recordId);
      setError("");
      setSuccess("");

      await api.delete(
        `/medical-records/${recordId}`
      );

      setRecords(
        (previous) =>
          previous.filter(
            (record) =>
              record._id !==
              recordId
          )
      );

      setSuccess(
        "Medical record deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete medical record error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to delete the medical record."
      );
    } finally {
      setDeletingId("");
      setActiveMenu(null);
    }
  }

  async function handleArchive(
    recordId
  ) {
    try {
      setArchivingId(recordId);
      setError("");
      setSuccess("");

      await api.patch(
        `/medical-records/${recordId}/archive`
      );

      setRecords(
        (previous) =>
          previous.filter(
            (record) =>
              record._id !==
              recordId
          )
      );

      setSuccess(
        "Medical record archived."
      );
    } catch (err) {
      console.error(
        "Archive medical record error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to archive the medical record."
      );
    } finally {
      setArchivingId("");
      setActiveMenu(null);
    }
  }

  async function openRecord(recordId) {
    setActiveMenu(null);
    setPreviewLoading(true);
    setError("");
    try {
      const record = records.find((item) => item._id === recordId);
      const response = await api.get(`/medical-records/${recordId}/view`, { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      setPreview({ url, mimeType: record?.mimeType || response.headers["content-type"] || "application/octet-stream", title: record?.title || "Medical document", fileName: record?.originalFileName || "document", id: recordId });
    } catch (err) {
      console.error("View medical record error:", err);
      setError(err.response?.data?.message || "Unable to open the medical document.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    if (preview?.url) window.URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  function downloadRecord(
    recordId
  ) {
    /*
     * Because this endpoint is protected,
     * simply opening the URL in a new tab
     * may not include the JWT. We handle
     * the download using the authenticated
     * API client instead.
     */

    downloadRecordAuthenticated(
      recordId
    );

    setActiveMenu(null);
  }

  async function downloadRecordAuthenticated(
    recordId
  ) {
    try {
      const response =
        await api.get(
          `/medical-records/${recordId}/download`,
          {
            responseType:
              "blob",
          }
        );

      const blobUrl =
        window.URL.createObjectURL(
          response.data
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = blobUrl;

      link.download =
        getDownloadName(
          recordId
        );

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        blobUrl
      );
    } catch (err) {
      console.error(
        "Download medical record error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to download the document."
      );
    }
  }

  function getDownloadName(
    recordId
  ) {
    const record =
      records.find(
        (item) =>
          item._id ===
          recordId
      );

    return (
      record?.originalFileName ||
      "medical-record"
    );
  }

  /*
   * Filter records locally.
   */

  const filteredRecords =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return records.filter(
        (record) => {
          const matchesCategory =
            categoryFilter ===
              "all" ||
            record.category ===
              categoryFilter;

          if (
            !matchesCategory
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const searchableText = [
            record.title,
            record.description,
            record.doctorName,
            record.hospitalName,
            record.originalFileName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedSearch
          );
        }
      );
    }, [
      records,
      categoryFilter,
      search,
    ]);

  /*
   * Category counts for UI.
   */

  const categoryCounts =
    useMemo(() => {
      const counts = {
        all: records.length,
      };

      Object.keys(
        CATEGORIES
      ).forEach(
        (category) => {
          counts[category] =
            records.filter(
              (record) =>
                record.category ===
                category
            ).length;
        }
      );

      return counts;
    }, [records]);

  return (
    <div className="medical-records-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <section className="records-page-header">

        <div>

          <button
            type="button"
            className="profile-back-button"
            onClick={() =>
              navigate("/patient")
            }
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>

          <div className="patient-page-eyebrow">
            MEDICAL RECORDS
          </div>

          <h1>
            Your secure health vault
          </h1>

          <p>
            Keep your reports, scans,
            prescriptions and important
            medical documents organized in one
            protected place.
          </p>

        </div>

        <button
          type="button"
          className="primary-button records-upload-button"
          onClick={
            openUploadModal
          }
        >
          <Upload size={17} />
          Upload document
        </button>

      </section>


      {/* =====================================================
          SECURITY BANNER
          ===================================================== */}

      <section className="records-security-banner">

        <div className="records-security-icon">
          <ShieldCheck size={19} />
        </div>

        <div>

          <strong>
            Your medical documents are private by default
          </strong>

          <p>
            Files are stored through authenticated
            backend routes. Access can later be
            extended through MediTrack's consent workflow.
          </p>

        </div>

        <div className="records-security-badge">
          <ShieldCheck size={14} />
          Protected
        </div>

      </section>


      {/* =====================================================
          ALERTS
          ===================================================== */}

      {error && (
        <div
          className="records-message error"
          role="alert"
        >
          <Info size={17} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>

        </div>
      )}

      {success && (
        <div
          className="records-message success"
          role="status"
        >
          <CheckCircle2 size={17} />

          <span>
            {success}
          </span>

        </div>
      )}


      {/* =====================================================
          CATEGORY STATS
          ===================================================== */}

      <section className="records-category-grid">

        <CategoryStat
          label="All documents"
          count={categoryCounts.all}
          active={
            categoryFilter ===
            "all"
          }
          onClick={() =>
            setCategoryFilter(
              "all"
            )
          }
        />

        {Object.entries(
          CATEGORIES
        )
          .slice(0, 4)
          .map(
            ([
              key,
              category,
            ]) => (
              <CategoryStat
                key={key}
                label={
                  category.label
                }
                count={
                  categoryCounts[
                    key
                  ] || 0
                }
                active={
                  categoryFilter ===
                  key
                }
                onClick={() =>
                  setCategoryFilter(
                    key
                  )
                }
              />
            )
          )}

      </section>


      {/* =====================================================
          TOOLBAR
          ===================================================== */}

      <section className="records-toolbar">

        <div className="records-search">

          <Search size={16} />

          <input
            type="search"
            placeholder="Search reports, doctors, hospitals..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <div className="records-filter">

          <Filter size={15} />

          <select
            value={
              categoryFilter
            }
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All document types
            </option>

            {Object.entries(
              CATEGORIES
            ).map(
              ([
                key,
                category,
              ]) => (
                <option
                  key={key}
                  value={key}
                >
                  {category.label}
                </option>
              )
            )}

          </select>

        </div>


        <button
          type="button"
          className="records-refresh-button"
          onClick={
            refreshRecords
          }
          disabled={refreshing}
          aria-label="Refresh records"
        >
          {refreshing ? (
            <LoaderCircle
              size={16}
              className="spin"
            />
          ) : (
            <Archive
              size={16}
            />
          )}
        </button>

      </section>


      {/* =====================================================
          RECORD LIST
          ===================================================== */}

      <section className="records-list-section">

        <div className="records-list-header">

          <div>
            <span>
              YOUR DOCUMENTS
            </span>

            <h2>
              {filteredRecords.length}{" "}
              {filteredRecords.length ===
              1
                ? "document"
                : "documents"}
            </h2>
          </div>

          <span className="records-result-caption">
            Showing active records
          </span>

        </div>


        {loading ? (
          <div className="records-loading">

            <LoaderCircle
              size={25}
              className="spin"
            />

            <span>
              Loading your medical records...
            </span>

          </div>
        ) : filteredRecords.length ===
          0 ? (
          <EmptyRecords
            hasSearch={
              Boolean(
                search.trim()
              ) ||
              categoryFilter !==
                "all"
            }
            onUpload={
              openUploadModal
            }
            onClear={() => {
              setSearch("");
              setCategoryFilter(
                "all"
              );
            }}
          />
        ) : (
          <div className="records-list">

            {filteredRecords.map(
              (record) => (
                <MedicalRecordCard
                  key={
                    record._id
                  }
                  record={record}
                  onView={
                    openRecord
                  }
                  onDownload={
                    downloadRecord
                  }
                  onArchive={
                    handleArchive
                  }
                  onDelete={
                    handleDelete
                  }
                  menuOpen={
                    activeMenu ===
                    record._id
                  }
                  onMenuToggle={(
                    event
                  ) => {
                    event.stopPropagation();

                    setActiveMenu(
                      (current) =>
                        current ===
                        record._id
                          ? null
                          : record._id
                    );
                  }}
                  deleting={
                    deletingId ===
                    record._id
                  }
                  archiving={
                    archivingId ===
                    record._id
                  }
                />
              )
            )}

          </div>
        )}

      </section>


      {/* =====================================================
          UPLOAD GUIDANCE
          ===================================================== */}

      <section className="records-guidance">

        <div className="guidance-icon">
          <Info size={17} />
        </div>

        <div>

          <strong>
            Supported documents
          </strong>

          <p>
            PDF, JPG, JPEG, PNG and WEBP up
            to 10 MB. Add a useful title and
            context so your records remain easy
            to find later.
          </p>

        </div>

      </section>


      {/* =====================================================
          UPLOAD MODAL
          ===================================================== */}

      {previewLoading && (
        <div className="record-preview-loading">
          <LoaderCircle size={22} className="spin" /> Opening document…
        </div>
      )}

      {preview && (
        <div className="record-preview-overlay" role="dialog" aria-modal="true" aria-label={preview.title}>
          <div className="record-preview-modal">
            <div className="record-preview-header">
              <div><span>MEDICAL RECORD</span><h2>{preview.title}</h2><small>{preview.fileName}</small></div>
              <button type="button" onClick={closePreview} aria-label="Close document"><X size={20}/></button>
            </div>
            <div className="record-preview-content">
              {preview.mimeType === "application/pdf" ? <iframe title={preview.title} src={preview.url} /> : preview.mimeType.startsWith("image/") ? <img src={preview.url} alt={preview.title} /> : <div className="record-preview-unsupported"><FileText size={42}/><h3>Preview is not available</h3><p>Download this document to open it with the appropriate application.</p><button type="button" className="primary-button" onClick={() => downloadRecord(preview.id)}>Download document</button></div>}
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <UploadRecordModal
          form={form}
          file={selectedFile}
          uploading={uploading}
          error={error}
          fileInputRef={
            fileInputRef
          }
          onClose={
            closeUploadModal
          }
          onChange={
            updateForm
          }
          onFileChange={
            handleFileChange
          }
          onSubmit={
            handleUpload
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   CATEGORY STAT
   ========================================================= */

function CategoryStat({
  label,
  count,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`records-category-stat ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span>
        {label}
      </span>

      <strong>
        {count}
      </strong>
    </button>
  );
}

/* =========================================================
   RECORD CARD
   ========================================================= */

function MedicalRecordCard({
  record,
  onView,
  onDownload,
  onArchive,
  onDelete,
  menuOpen,
  onMenuToggle,
  deleting,
  archiving,
}) {
  const config =
    CATEGORIES[
      record.category
    ] || CATEGORIES.other;

  const Icon =
    getFileIcon(
      record.mimeType
    );

  return (
    <article className="medical-record-card">

      <div className="record-file-icon">
        <Icon size={23} />
      </div>


      <div className="record-main">

        <div className="record-title-row">

          <div>

            <h3>
              {record.title}
            </h3>

            <div className="record-meta-primary">

              <span>
                {config.shortLabel}
              </span>

              <span className="record-dot">
                •
              </span>

              <span>
                {formatDate(
                  record.documentDate ||
                    record.createdAt
                )}
              </span>

            </div>

          </div>

          <span className="record-private-badge">
            <ShieldCheck size={11} />
            Private
          </span>

        </div>


        <div className="record-context">

          {record.doctorName && (
            <span>
              Doctor:{" "}
              <strong>
                {record.doctorName}
              </strong>
            </span>
          )}

          {record.hospitalName && (
            <span>
              Hospital:{" "}
              <strong>
                {record.hospitalName}
              </strong>
            </span>
          )}

          <span>
            File:{" "}
            <strong>
              {record.originalFileName}
            </strong>
          </span>

          <span>
            Size:{" "}
            <strong>
              {formatFileSize(
                record.fileSize
              )}
            </strong>
          </span>

        </div>


        {record.description && (
          <p className="record-description">
            {record.description}
          </p>
        )}

      </div>


      <div className="record-actions">

        <button
          type="button"
          className="record-primary-action"
          onClick={() =>
            onView(
              record._id
            )
          }
        >
          <FileText size={15} />
          View
        </button>

        <div className="record-more-wrapper">

          <button
            type="button"
            className="record-more-button"
            onClick={
              onMenuToggle
            }
            aria-label="More actions"
            aria-expanded={
              menuOpen
            }
          >
            <MoreVertical
              size={17}
            />
          </button>

          {menuOpen && (
            <div
              className="record-action-menu"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                type="button"
                onClick={() =>
                  onDownload(
                    record._id
                  )
                }
              >
                <Download
                  size={15}
                />
                Download
              </button>

              <button
                type="button"
                onClick={() =>
                  onArchive(
                    record._id
                  )
                }
                disabled={archiving}
              >
                {archiving ? (
                  <LoaderCircle
                    size={15}
                    className="spin"
                  />
                ) : (
                  <Archive
                    size={15}
                  />
                )}
                Archive
              </button>

              <button
                type="button"
                className="danger"
                onClick={() =>
                  onDelete(
                    record._id
                  )
                }
                disabled={deleting}
              >
                {deleting ? (
                  <LoaderCircle
                    size={15}
                    className="spin"
                  />
                ) : (
                  <Trash2
                    size={15}
                  />
                )}
                Delete
              </button>

            </div>
          )}

        </div>

      </div>

    </article>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyRecords({
  hasSearch,
  onUpload,
  onClear,
}) {
  return (
    <div className="records-empty">

      <div className="records-empty-icon">
        <FolderOpen size={25} />
      </div>

      <h3>
        {hasSearch
          ? "No matching records"
          : "Your medical vault is empty"}
      </h3>

      <p>
        {hasSearch
          ? "Try a different search term or remove the current filter."
          : "Upload your reports, scans, prescriptions and other medical documents here."}
      </p>

      <div className="records-empty-actions">

        {hasSearch ? (
          <button
            type="button"
            className="secondary-action-button"
            onClick={onClear}
          >
            Clear filters
          </button>
        ) : null}

        <button
          type="button"
          className="primary-button"
          onClick={onUpload}
        >
          <Upload size={16} />
          Upload first document
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   UPLOAD MODAL
   ========================================================= */

function UploadRecordModal({
  form,
  file,
  uploading,
  error,
  fileInputRef,
  onClose,
  onChange,
  onFileChange,
  onSubmit,
}) {
  return (
    <div
      className="records-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className="records-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-record-title"
      >

        {/* HEADER */}

        <div className="records-modal-header">

          <div>

            <span>
              MEDICAL DOCUMENT
            </span>

            <h2 id="upload-record-title">
              Add to your health vault
            </h2>

            <p>
              Organize the document now so
              you can find it easily later.
            </p>

          </div>

          <button
            type="button"
            className="records-modal-close"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>


        <form
          onSubmit={onSubmit}
          className="records-upload-form"
        >

          {/* FILE */}

          <div className="upload-field">

            <label>
              Medical document
              <span className="required-star">
                *
              </span>
            </label>

            <input
  ref={fileInputRef}
  id="medical-document-upload"
  type="file"
  accept={ACCEPTED_FILES}
  onChange={onFileChange}
  disabled={uploading}
  className="upload-file-input"
/>

<label
  htmlFor="medical-document-upload"
  className="upload-dropzone"
>

              <Upload size={22} />

              <strong>
                {file
                  ? file.name
                  : "Choose a document"}
              </strong>

              <span>
                PDF, JPG, JPEG, PNG or WEBP
                • Maximum 10 MB
              </span>

              {file && (
                <small>
                  {formatFileSize(
                    file.size
                  )}
                </small>
              )}

              <span className="upload-browse">
                Browse files
              </span>

            </label>

          </div>


          {/* TITLE + CATEGORY */}

          <div className="upload-two-columns">

            <UploadField
              label="Document title"
              required
            >
              <input
                type="text"
                placeholder="e.g. Complete Blood Count"
                value={
                  form.title
                }
                onChange={(event) =>
                  onChange(
                    "title",
                    event.target.value
                  )
                }
                disabled={uploading}
                maxLength={150}
              />
            </UploadField>


            <UploadField
              label="Category"
              required
            >
              <select
                value={
                  form.category
                }
                onChange={(event) =>
                  onChange(
                    "category",
                    event.target.value
                  )
                }
                disabled={uploading}
              >
                {Object.entries(
                  CATEGORIES
                ).map(
                  ([
                    key,
                    category,
                  ]) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {category.label}
                    </option>
                  )
                )}
              </select>
            </UploadField>

          </div>


          {/* DOCTOR + HOSPITAL */}

          <div className="upload-two-columns">

            <UploadField
              label="Doctor"
              optional
            >
              <input
                type="text"
                placeholder="Doctor name"
                value={
                  form.doctorName
                }
                onChange={(event) =>
                  onChange(
                    "doctorName",
                    event.target.value
                  )
                }
                disabled={uploading}
                maxLength={150}
              />
            </UploadField>


            <UploadField
              label="Hospital / clinic"
              optional
            >
              <input
                type="text"
                placeholder="Hospital or clinic"
                value={
                  form.hospitalName
                }
                onChange={(event) =>
                  onChange(
                    "hospitalName",
                    event.target.value
                  )
                }
                disabled={uploading}
                maxLength={150}
              />
            </UploadField>

          </div>


          {/* DATE + VISIBILITY */}

          <div className="upload-two-columns">

            <UploadField
              label="Document date"
              optional
            >
              <input
                type="date"
                value={
                  form.documentDate
                }
                onChange={(event) =>
                  onChange(
                    "documentDate",
                    event.target.value
                  )
                }
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                disabled={uploading}
              />
            </UploadField>


            <UploadField
              label="Sharing"
              optional
            >
              <select
                value={
                  form.visibility
                }
                onChange={(event) =>
                  onChange(
                    "visibility",
                    event.target.value
                  )
                }
                disabled={uploading}
              >
                <option value="private">
                  Private
                </option>

                <option value="authorized_care">
                  Available to authorized care
                </option>
              </select>
            </UploadField>

          </div>


          {/* DESCRIPTION */}

          <UploadField
            label="Personal description"
            optional
            hint="Add any useful context about this document."
          >
            <textarea
              rows="3"
              placeholder="e.g. Blood test requested during my annual check-up."
              value={
                form.description
              }
              onChange={(event) =>
                onChange(
                  "description",
                  event.target.value
                )
              }
              disabled={uploading}
              maxLength={1000}
            />
          </UploadField>


          {/* ERROR */}

          {error && (
            <div className="upload-modal-error">

              <Info size={15} />

              <span>
                {error}
              </span>

            </div>
          )}


          {/* SECURITY NOTE */}

          <div className="upload-security-note">

            <ShieldCheck size={15} />

            <span>
              Your document will be stored through
              MediTrack's authenticated medical-record
              service. It is private by default.
            </span>

          </div>


          {/* FOOTER */}

          <div className="records-modal-footer">

            <button
              type="button"
              className="secondary-action-button"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="spin"
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload
                    size={16}
                  />
                  Upload document
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

/* =========================================================
   UPLOAD FIELD
   ========================================================= */

function UploadField({
  label,
  children,
  required = false,
  optional = false,
  hint = "",
}) {
  return (
    <label className="upload-field">

      <span className="upload-field-label">

        {label}

        {required && (
          <span className="required-star">
            *
          </span>
        )}

        {optional && (
          <small>
            optional
          </small>
        )}

      </span>

      {children}

      {hint && (
        <span className="upload-field-hint">
          {hint}
        </span>
      )}

    </label>
  );
}

export default MedicalRecords;