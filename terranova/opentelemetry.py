from opentelemetry.instrumentation.elasticsearch import ElasticsearchInstrumentor

# from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.asgi import OpenTelemetryMiddleware
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.trace import set_tracer_provider
import os

from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor, ConsoleLogExporter
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry._logs import set_logger_provider

from terranova.settings import (
    ENVIRONMENT,
    OTLP_ENDPOINT,
    OTLP_SECRET,
    SERVICENAME,
    VERSION,
    LOGLEVEL,
)
from terranova.logging import logger
from terranova.backends.datasources import datasources


def init_telemetry(fastapi_app=None, stdout=False):

    # If OTLP is not configured, this function does nothing
    if not OTLP_ENDPOINT:
        return fastapi_app

    resource = Resource.create(
        {
            "service.name": SERVICENAME,
            "service.version": VERSION,
            "deployment.environment": ENVIRONMENT,
        }
    )

    #
    # Setup global tracer and span exporters
    #
    tracer_provider = TracerProvider(resource=resource)
    set_tracer_provider(tracer_provider)

    if stdout:
        tracer_provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

    # Same exporting config for traces + logs
    exporter_args = {
        "endpoint": OTLP_ENDPOINT,
        "headers": {"authorization": "ApiKey %s" % OTLP_SECRET},
    }

    span_exporter = OTLPSpanExporter(**exporter_args)
    tracer_provider.add_span_processor(BatchSpanProcessor(span_exporter))

    #
    # Setup global log exporters
    #
    logger_provider = LoggerProvider(resource=resource)
    set_logger_provider(logger_provider)

    log_exporter = OTLPLogExporter(**exporter_args)
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(log_exporter))

    if stdout:
        logger_provider.add_log_record_processor(BatchLogRecordProcessor(ConsoleLogExporter()))

    handler = LoggingHandler(level=LOGLEVEL, logger_provider=logger_provider)
    logger.addHandler(handler)

    # Capture http referer label if present
    os.environ.setdefault("OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST", "referer")

    #
    # Enable global instrumentation for logging and FastAPI framework
    #
    LoggingInstrumentor().instrument(set_logging_format=True)

    # It looks like this is being improved so that we can disable sanitization of queries
    # but for the time being there's no ability to control this
    # https://github.com/open-telemetry/semantic-conventions/issues/705
    ElasticsearchInstrumentor().instrument()

    # Requests for esdb fetcher
    RequestsInstrumentor().instrument()

    # https://github.com/open-telemetry/opentelemetry-python/issues/3477
    # FastAPIInstrumentor.instrument_app(fastapi_app, tracer_provider=tracer_provider)
    if fastapi_app:
        return OpenTelemetryMiddleware(fastapi_app)
