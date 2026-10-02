'use client';

import { useState } from 'react';
import { FileText, FileUp, Trash2 } from 'lucide-react';
import { Panel } from '@/components/Panel';

type LocalDocument = { id: string; name: string; size: number; addedAt: string };

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);

  function addDocuments(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      size: file.size,
      addedAt: new Date().toLocaleDateString(),
    }));
    setDocuments((current) => [...current, ...added]);
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="documents-header">
        <div>
          <h1 className="font-orbitron text-3xl text-neon-cyan">Documents</h1>
          <p className="mt-1 text-gray-400">Files in this browser session.</p>
        </div>
        <label className="documents-upload">
          <FileUp size={16} /> Add documents
          <input
            className="sr-only"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={(event) => {
              addDocuments(event.currentTarget.files);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </header>

      {documents.length === 0 ? (
        <Panel className="documents-empty">
          <FileText size={28} />
          <p>No documents added</p>
        </Panel>
      ) : (
        <div className="documents-grid">
          {documents.map((document) => (
            <article className="documents-card" key={document.id}>
              <FileText className="documents-card-icon" size={32} />
              <h2 title={document.name}>{document.name}</h2>
              <p>{formatFileSize(document.size)}</p>
              <div className="documents-card-footer">
                <time>{document.addedAt}</time>
                <button
                  type="button"
                  aria-label={`Remove ${document.name}`}
                  onClick={() => setDocuments((current) => current.filter((item) => item.id !== document.id))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}