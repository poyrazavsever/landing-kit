import { useEffect, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PackageOpen, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EmptyState, ErrorState, LoadingList, PageHeader } from '@/components/common';
import { siteApi } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { cn, formatPrice } from '@/lib/utils';

function ItemRow({ item, collectionKey, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-card p-2.5 pr-3 shadow-xs',
        isDragging && 'relative z-10 shadow-xl ring-2 ring-ring',
      )}
      data-testid="item-row"
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="grid h-14 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label={`"${item.title}" sırasını değiştir`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      {item.image ? (
        <img
          src={item.image}
          alt=""
          className={cn(
            'size-16 shrink-0 rounded-lg object-cover',
            !item.active && 'opacity-50 grayscale',
          )}
        />
      ) : (
        <div
          className="grid size-16 shrink-0 place-items-center rounded-lg bg-accent font-heading text-xl font-bold text-accent-foreground"
          aria-hidden="true"
        >
          {item.title.charAt(0).toLocaleUpperCase('tr-TR')}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <a
          href={`#/c/${collectionKey}/${item.id}`}
          className="line-clamp-2 font-semibold leading-snug"
          data-testid="item-title"
        >
          {item.title}
        </a>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {item.price !== null && (
            <span className="font-semibold tabular-nums">{formatPrice(item.price)}</span>
          )}
          {item.active ? <Badge>Sitede</Badge> : <Badge variant="muted">Gizli</Badge>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <Switch
          checked={item.active}
          onCheckedChange={(value) => onToggle(item, value)}
          aria-label={`"${item.title}" sitede görünsün`}
        />
        <a
          href={`#/c/${collectionKey}/${item.id}`}
          className="inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent"
          aria-label={`"${item.title}" düzenle`}
        >
          <Pencil className="size-3.5" aria-hidden="true" /> Düzenle
        </a>
      </div>
    </li>
  );
}

export default function Collection({ collectionKey }) {
  const { slug, site, refreshSite } = useApp();
  const col = site.collections.find((c) => c.key === collectionKey) || {
    key: collectionKey,
    label: collectionKey,
  };
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    siteApi(slug, 'GET', `/items?collection=${encodeURIComponent(collectionKey)}`)
      .then((data) => alive && (setItems(data.items), setError(null)))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [slug, collectionKey, reloadKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(
      items,
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id),
    );
    setItems(next);
    try {
      await siteApi(slug, 'POST', '/items/reorder', {
        collection: collectionKey,
        ids: next.map((i) => i.id),
      });
      toast.success('Sıralama kaydedildi.');
    } catch (err) {
      setItems(previous);
      toast.error(err.message);
    }
  }

  async function onToggle(item, active) {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, active } : i)));
    try {
      await siteApi(slug, 'PATCH', `/items/${item.id}`, { active });
      toast.success(active ? `"${item.title}" artık sitede.` : `"${item.title}" gizlendi.`);
      refreshSite();
    } catch (err) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, active: !active } : i)));
      toast.error(err.message);
    }
  }

  return (
    <>
      <PageHeader
        back="#/"
        backLabel="Ana sayfa"
        title={col.label}
        description={
          items?.length
            ? 'Sırayı tutup sürükleyerek değiştirin. Anahtarı kapatırsanız kayıt sitede görünmez.'
            : undefined
        }
        action={
          items?.length ? (
            <Button asChild size="sm">
              <a href={`#/c/${collectionKey}/yeni`}>
                <Plus aria-hidden="true" /> Yeni ekle
              </a>
            </Button>
          ) : null
        }
      />
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : !items ? (
        <LoadingList />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Burada henüz bir şey yok"
          description="İlk kaydı ekleyin; fotoğrafını telefonunuzla çekebilirsiniz."
          action={
            <Button asChild size="lg" className="mt-2">
              <a href={`#/c/${collectionKey}/yeni`}>
                <Plus aria-hidden="true" /> İlk kaydı ekle
              </a>
            </Button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2.5" aria-label={`${col.label} listesi`}>
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  collectionKey={collectionKey}
                  onToggle={onToggle}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </>
  );
}
