import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { User, AlertCircle } from 'lucide-react';

interface Props {
  nome: string;
  photoPath?: string | null;
  className?: string;
}

export function EmployeeAvatar({ nome, photoPath, className = '' }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let currentObjectUrl: string | null = null;

    if (!photoPath) {
      setPhotoUrl(null);
      setLoading(false);
      setError(false);
      return;
    }

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
        
        const response = await fetch(url);
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
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [photoPath]);

  const initials = nome
    .split(' ')
    .filter(n => n.trim().length > 0)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-gray-100 ${className} animate-pulse`}>
         {/* Simple pulse loader */}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-red-100 text-red-500 ${className}`} title="Erro ao carregar foto">
        <AlertCircle className="w-1/2 h-1/2" />
      </div>
    );
  }

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={nome}
        className={`object-cover rounded-full bg-gray-100 ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold ${className}`}
    >
      <span className="text-[0.45em] leading-none">{initials}</span>
    </div>
  );
}
