// Shared function amongst all library pages
export const markFavorite = (
    userDataController: any,
    _favorites: any, // Favorites context has full objects — use controller instance instead
    datatype: string,
    id: string,
) => {
    // Read string IDs from the controller instance (not the Favorites context, which has full objects)
    const rawList: string[] = userDataController.instance?.favorites?.[datatype] ?? [];
    const currentList = [...rawList];
    if (currentList.includes(id)) {
        currentList.splice(currentList.indexOf(id), 1);
    } else {
        currentList.push(id);
    }
    userDataController.setProperty(`favorites`, {
        ...userDataController.instance?.favorites,
        [datatype]: currentList,
    });
    userDataController.update();
};
