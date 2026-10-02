import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { listFavourites, toggleFavourite } from '@/lib/favourites';

export default function FavouritesScreen() {
  const queryClient = useQueryClient();
  const favs = useQuery({
    queryKey: ['favourites'],
    queryFn: listFavourites,
  });

  return (
    <Screen>
      <Text variant="display">Your favourites</Text>
      {favs.isLoading ? (
        <Card>
          <Text variant="body">Loading favourites…</Text>
        </Card>
      ) : null}
      {favs.error ? (
        <Card>
          <Text variant="body">
            {favs.error instanceof Error
              ? favs.error.message
              : 'Couldn\u2019t load favourites.'}
          </Text>
        </Card>
      ) : null}
      {(favs.data ?? []).map((f) => (
        <Card key={f.question_id}>
          <Text variant="body">{f.text}</Text>
          <Button
            label="Remove"
            variant="outline"
            onPress={async () => {
              await toggleFavourite(f.question_id);
              await queryClient.invalidateQueries({
                queryKey: ['favourites'],
              });
            }}
          />
        </Card>
      ))}
      {favs.data && favs.data.length === 0 ? (
        <Card>
          <Text variant="body">
            Nothing saved yet. Heart a question during a session and it will
            wait for you here.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}
