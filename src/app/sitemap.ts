import { MetadataRoute } from 'next';
import { getUsers } from '@/actions/users';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vasudha-connect.web.app';
  const allUsers = await getUsers();
  const approvedUsers = allUsers.filter(u => u.status === 'approved');

  const profileUrls = approvedUsers.map((user) => ({
    url: `${baseUrl}/profile/${user.id}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...profileUrls,
  ];
}
