from terranova.backends.datasources import datasources
import threading
from terranova.logging import logger
import terranova.opentelemetry


def main():
    terranova.opentelemetry.init_telemetry()

    for name, datasource in datasources.items():
        if hasattr(datasource, "fetch"):
            logger.info(
                "Spawning thread to perform fetch operation for cache for '%s' plugin", name
            )

            def wrap(fetch, datasource_name):
                def do_fetch():
                    fetch()
                    logger.info("Cache fetch has concluded for %s" % datasource_name)

                return do_fetch

            t = threading.Thread(target=wrap(datasource.fetch, name))
            t.start()
            logger.info("Fetch thread with details %s has started for '%s' plugin", t, name)


if __name__ == "__main__":
    main()
