#!/usr/bin/env python3
"""Search for traces from experiment 2639312608800919."""

from datetime import datetime

import mlflow


def search_experiment_traces():
  """Search for traces from experiment 2639312608800919."""
  # Set tracking URI
  mlflow.set_tracking_uri('databricks')

  try:
    # Search for traces from the specific experiment
    traces = mlflow.search_traces(
      experiment_ids=['2639312608800919'],
      max_results=5,
      order_by=['attributes.timestamp_ms DESC'],
      return_type='list',
    )

    print(f'Found {len(traces)} traces from experiment 2639312608800919:')
    print('=' * 80)

    for i, trace in enumerate(traces, 1):
      print(f'\n--- Trace {i} ---')
      print(f'Trace ID: {trace.info.trace_id}')
      print(f'Status: {trace.info.status}')
      print(f'Timestamp: {datetime.fromtimestamp(trace.info.timestamp_ms / 1000)}')
      print(f'Execution Time: {trace.info.execution_time_ms}ms')

      # Print tags if available
      if trace.info.tags:
        print(f'Tags: {dict(trace.info.tags)}')

      # Print request preview if available
      if hasattr(trace.info, 'request') and trace.info.request:
        print(f'Request Preview: {trace.info.request[:200]}...')

      # Print response preview if available
      if hasattr(trace.info, 'response') and trace.info.response:
        print(f'Response Preview: {trace.info.response[:200]}...')

      # Print span information if available
      if hasattr(trace, 'data') and trace.data and hasattr(trace.data, 'spans'):
        print(f'Number of spans: {len(trace.data.spans)}')
        for j, span in enumerate(trace.data.spans[:3]):  # Show first 3 spans
          print(f'  Span {j + 1}: {span.name} ({span.span_type})')

  except Exception as e:
    print(f'Error searching traces: {e}')
    import traceback

    traceback.print_exc()


if __name__ == '__main__':
  search_experiment_traces()
