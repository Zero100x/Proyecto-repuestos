'use client';

import React, { useState, useEffect } from 'react';
import { PartQuestion } from '../lib/types';
import { fetchPartQuestions, createPartQuestion, answerPartQuestion } from '../lib/api';

interface ProductTechnicalQAProps {
  partId: string;
  partName: string;
}

export default function ProductTechnicalQA({ partId, partName }: ProductTechnicalQAProps) {
  const [questions, setQuestions] = useState<PartQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // New question form state
  const [authorName, setAuthorName] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Seller answering state
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [answeringSubmitting, setAnsweringSubmitting] = useState(false);

  useEffect(() => {
    // Check if store user is logged in
    const storedToken = localStorage.getItem('repuestos_token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('repuestos_user') || localStorage.getItem('user');
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
        const displayName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.name || '';
        if (displayName) setAuthorName(displayName);
      } catch (e) {
        // ignore
      }
    }

    loadQuestions();
  }, [partId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchPartQuestions(partId);
      setQuestions(data);
    } catch (err) {
      console.error('Error fetching part questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const created = await createPartQuestion(partId, {
        authorName: authorName.trim() || 'Comprador verificado',
        question: newQuestion.trim(),
      });
      setQuestions(prev => [created, ...prev]);
      setNewQuestion('');
      setSuccessMsg('Tu pregunta ha sido enviada al equipo técnico y distribuidores.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo registrar la consulta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    if (!token || !answerDraft.trim()) return;

    setAnsweringSubmitting(true);
    try {
      const responderName = currentUser?.store?.name
        ? `${currentUser.name} (${currentUser.store.name})`
        : currentUser?.name || 'Asesor Técnico Especializado';

      const updated = await answerPartQuestion(token, questionId, {
        answer: answerDraft.trim(),
        answeredBy: responderName,
      });

      setQuestions(prev =>
        prev.map(q => (q.id === questionId ? updated : q)),
      );
      setAnsweringId(null);
      setAnswerDraft('');
    } catch (err: any) {
      alert(err.message || 'Error al enviar respuesta');
    } finally {
      setAnsweringSubmitting(false);
    }
  };

  return (
    <section className="mt-14 bg-white border border-[var(--outline-variant)] rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[var(--outline-variant)] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--on-tertiary-container)] text-2xl">
              contact_support
            </span>
            <h2 className="font-heading text-xl font-bold text-[var(--primary)]">
              Preguntas Técnicas y Compatibilidad
            </h2>
          </div>
          <p className="font-sans text-xs text-[var(--secondary)] mt-1">
            Resuelve dudas específicas sobre especificaciones, número de parte OEM, versión de motor o ajuste para{' '}
            <strong className="text-[var(--primary)]">{partName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[var(--surface-container-low)] px-3 py-1.5 rounded-lg border border-[var(--outline-variant)] self-start sm:self-auto">
          <span className="material-symbols-outlined text-sm text-[var(--secondary)]">forum</span>
          <span className="font-mono text-xs font-semibold text-[var(--primary)]">
            {questions.length} {questions.length === 1 ? 'consulta' : 'consultas'}
          </span>
        </div>
      </div>

      {/* Ask Question Box */}
      <form onSubmit={handlePostQuestion} className="my-6 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl p-4 sm:p-5">
        <label className="block font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-2">
          ¿Tienes dudas sobre la compatibilidad con tu vehículo?
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            placeholder="Tu nombre o taller (ej: Taller Mecánico Gómez)"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            className="sm:col-span-1 px-3.5 py-2 text-xs rounded-lg border border-[var(--outline-variant)] bg-white text-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            required
          />
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Escribe tu consulta técnica (ej: ¿Aplica para modelo 2021 motor 2.0L transmisión manual?)"
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-[var(--outline-variant)] bg-white text-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] pr-24"
              required
            />
            <button
              type="submit"
              disabled={submitting || !newQuestion.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[var(--primary)] text-white text-xs font-heading font-bold px-3 py-1.5 rounded-md hover:bg-[#1a2333] transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {submitting ? (
                <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-xs">send</span>
              )}
              <span>Preguntar</span>
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="flex items-center gap-1.5 text-xs text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] p-2.5 rounded-lg font-medium">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg font-medium">
            <span className="material-symbols-outlined text-sm">error</span>
            {errorMsg}
          </div>
        )}
      </form>

      {/* Questions list */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--secondary)] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base animate-spin">refresh</span>
            Cargando historial de consultas técnicas...
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[var(--surface-container-lowest)] rounded-xl border border-dashed border-[var(--outline-variant)]">
            <span className="material-symbols-outlined text-3xl text-[var(--secondary)] mb-2 block">
              chat_bubble_outline
            </span>
            <p className="font-heading font-bold text-sm text-[var(--primary)]">
              No hay preguntas registradas todavía
            </p>
            <p className="font-sans text-xs text-[var(--secondary)] mt-1 max-w-md mx-auto">
              Sé el primero en consultar sobre ajustes mecánicos, números OEM o disponibilidad para resolver tus dudas de inmediato.
            </p>
          </div>
        ) : (
          questions.map(q => (
            <div
              key={q.id}
              className="border border-[var(--outline-variant)] rounded-xl p-4 sm:p-5 bg-white hover:border-[var(--primary)]/30 transition-all flex flex-col gap-3"
            >
              {/* Question Item */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--primary)] font-bold text-[10px]">
                      {q.authorName ? q.authorName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="font-heading text-xs font-bold text-[var(--primary)]">
                      {q.authorName || 'Comprador'}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--secondary)]">
                      • {new Date(q.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {q.answer ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                      Respuesta Verificada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Pendiente de respuesta
                    </span>
                  )}
                </div>

                <p className="font-sans text-xs text-[var(--primary)] pl-8 font-medium">
                  {q.question}
                </p>
              </div>

              {/* Answer Box if answered */}
              {q.answer ? (
                <div className="ml-4 sm:ml-8 mt-1 p-3.5 bg-[var(--surface-container-low)] border-l-4 border-l-[#059669] rounded-r-xl border border-[var(--outline-variant)]">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-[var(--secondary)]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#059669] text-base">
                        verified
                      </span>
                      <strong className="text-[var(--primary)]">{q.answeredBy || 'Asesor Técnico'}</strong>
                    </div>
                    {q.answeredAt && (
                      <span className="font-mono text-[10px]">
                        {new Date(q.answeredAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-[var(--primary)] leading-relaxed pl-5">
                    {q.answer}
                  </p>
                </div>
              ) : (
                /* Seller Quick Reply Action if authenticated seller/admin */
                token && (
                  <div className="ml-4 sm:ml-8 mt-1">
                    {answeringId === q.id ? (
                      <div className="bg-[var(--surface-container-low)] p-3 rounded-xl border border-[var(--outline-variant)]">
                        <label className="block font-heading text-[11px] font-bold text-[var(--primary)] mb-1">
                          Responder como Asesor de Almacén:
                        </label>
                        <textarea
                          rows={2}
                          value={answerDraft}
                          onChange={e => setAnswerDraft(e.target.value)}
                          placeholder="Indica la compatibilidad, sugerencias técnicas o recomendaciones de instalación..."
                          className="w-full text-xs p-2.5 rounded-lg border border-[var(--outline-variant)] bg-white text-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAnsweringId(null);
                              setAnswerDraft('');
                            }}
                            className="px-3 py-1 text-xs text-[var(--secondary)] hover:text-[var(--primary)]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={answeringSubmitting || !answerDraft.trim()}
                            onClick={() => handleAnswerQuestion(q.id)}
                            className="btn btn-primary text-xs px-3 py-1 font-bold flex items-center gap-1"
                          >
                            {answeringSubmitting ? 'Enviando...' : 'Publicar Respuesta'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAnsweringId(q.id);
                          setAnswerDraft('');
                        }}
                        className="text-xs font-semibold text-[var(--on-tertiary-container)] hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">reply</span>
                        Responder como Asesor / Distribuidor
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
