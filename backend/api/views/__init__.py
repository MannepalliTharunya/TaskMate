from .auth_views import RegisterView, LoginView, MeView
from .task_views import TaskListCreateView, TaskDetailView
from .document_views import DocumentListCreateView, DocumentDetailView
from .search_views import SearchView
from .analytics_views import AnalyticsView

__all__ = [
    'RegisterView', 'LoginView', 'MeView',
    'TaskListCreateView', 'TaskDetailView',
    'DocumentListCreateView', 'DocumentDetailView',
    'SearchView',
    'AnalyticsView',
]
