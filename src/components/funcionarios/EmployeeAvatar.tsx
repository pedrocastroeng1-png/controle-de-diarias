import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { AlertCircle } from 'lucide-react';

interface Props {
  nome: string;
  photoPath?: string | null;
  className?: string;
}

export function EmployeeAvatar(props: Props) {
  return <AvatarImage key={props.photoPath ?? 'no-photo'} {...props} />;
}

function AvatarImage({ nome, photoPath, className = '' }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    let currentObjectUrl: string | null = null;

    if (!photoPath) {
      setPhotoUrl(null);
      setLoading(false);
      setError(false);
      window.clearTimeout(timeout);
      return;
    }

    setPhotoUrl(null);
    setLoading(true);
    setError(false);

    async function load() {
      try {
        const url = await api.getPhotoUrl('employee-photos', photoPath!);
        if (!url || !mounted) {
          if (mounted) {
            setError(true);
            setLoading(false);
          }
          return;
        }
        
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          if (mounted) {
            setError(true);
            setLoading(false);
          }
          return;
        }
        
        const blob = await response.blob();
        if (!mounted) return;
        
        currentObjectUrl = URL.createObjectURL(blob);
        setPhotoUrl(currentObjectUrl);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load photo', err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      controller.abort();
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [photoPath, attempt]);

  const initials = nome
    .split(' ')
    .filter(n => n.trim().length > 0)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-gray-100 shrink-0 ${className} motion-safe:animate-pulse`}>
         {/* Simple pulse loader */}
      </div>
    );
  }

  if (error) {
    return (
      <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setAttempt(n => n + 1); }} aria-label={`Tentar carregar foto de ${nome} novamente`} className={`flex items-center justify-center rounded-full bg-red-100 text-red-500 shrink-0 ${className}`} title="Erro ao carregar foto. Tentar novamente">
        <AlertCircle className="w-1/2 h-1/2" />
      </button>
    );
  }

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`Foto de ${nome}`}
        onError={() => setError(true)}
        className={`object-cover rounded-full bg-gray-100 ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold ${className}`}
    >
      <span className="text-sm leading-none">{initials}</span>
    </div>
  );
}
