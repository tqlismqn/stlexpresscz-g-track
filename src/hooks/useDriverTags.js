import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useDriverTags() {
  const { data: tags = [] } = useQuery({
    queryKey: ['driverTags'],
    queryFn: () => base44.entities.DriverTag.list(),
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const tagMap = {};
  tags.forEach(tag => { tagMap[tag.id] = tag; });

  const archiveTags = tags.filter(t =>
    t.allowed_statuses?.includes('archived') && !t.allowed_statuses?.includes('active') && !t.allowed_statuses?.includes('candidate')
  );

  return { tags, tagMap, archiveTags };
}