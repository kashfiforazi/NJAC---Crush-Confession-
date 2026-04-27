import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';

export default function GenericNewsBlog({ type }: { type: 'news' | 'blog' }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(
          collection(db, 'news_blogs'),
          where('type', '==', type),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type]);

  const title = type === 'news' ? 'Latest News' : 'Recent Blogs';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4">
      <div className="glass-card p-8 text-center bg-gradient-to-br from-primary-50 to-rose-100 dark:from-slate-800 dark:to-slate-900">
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-slate-900 dark:text-white capitalize">
          {title}
        </h1>
      </div>

      {loading ? (
        <div className="text-center py-12"><p>Loading...</p></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <p className="text-slate-500">No entries found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: any, key?: any }) {
  const content = (
    <div className="flex flex-col md:flex-row gap-6">
      {item.imageUrl && (
        <div className="w-full md:w-1/3 h-48 md:h-auto shrink-0 overflow-hidden rounded-xl">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="flex flex-col justify-center p-2">
        <h3 className="font-bold font-heading text-2xl mb-3 hover:text-primary-500 transition-colors">{item.title}</h3>
        <p className="text-slate-800 font-medium dark:text-slate-200 line-clamp-3 mb-4">{item.content}</p>
        <div className="flex items-center text-sm text-slate-600 font-bold dark:text-slate-400 mt-auto">
          <span>{item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : ''}</span>
        </div>
      </div>
    </div>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block glass-card p-4 overflow-hidden hover:shadow-xl transition-shadow group">
        {content}
      </a>
    );
  }

  return (
    <Link to={`/${item.type}/${item.id}`} className="block glass-card p-4 overflow-hidden hover:shadow-xl transition-shadow group">
      {content}
    </Link>
  );
}
