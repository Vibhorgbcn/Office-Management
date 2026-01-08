import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WorkIcon from '@mui/icons-material/Work';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GavelIcon from '@mui/icons-material/Gavel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArticleIcon from '@mui/icons-material/Article';
import EventIcon from '@mui/icons-material/Event';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import axios from 'axios';

const drawerWidth = 260;
const mobileDrawerWidth = 280;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await axios.get('/notifications?limit=10');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications on mount and when notification menu opens
  React.useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(`/notifications/${notificationId}/read`);
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return notificationDate.toLocaleDateString();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
    fetchNotifications(); // Refresh when opening
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleProfileClick = (event) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleLogoutClick = () => {
    handleProfileClose();
    handleLogout();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: `/${user?.role}` },
    { text: 'Attendance', icon: <AccessTimeIcon />, path: `/${user?.role}/attendance` },
    { text: 'Cases', icon: <AssignmentIcon />, path: `/${user?.role}/cases` },
    { text: 'Tasks', icon: <WorkIcon />, path: `/${user?.role}/tasks` },
    { text: 'Work Assignments', icon: <WorkIcon />, path: `/${user?.role}/work-assignments` },
  ];

  if (user?.role === 'admin') {
    menuItems.push(
      { text: 'Bills', icon: <ReceiptIcon />, path: '/admin/bills' },
      { text: 'Clients', icon: <PeopleIcon />, path: '/admin/clients' },
      { text: 'Causelists', icon: <CalendarTodayIcon />, path: '/admin/causelists' },
      { text: 'Calendar', icon: <EventIcon />, path: '/admin/calendar' },
      { text: 'Contracts', icon: <DescriptionIcon />, path: '/admin/contracts' },
      { text: 'Legal Notices', icon: <ArticleIcon />, path: '/admin/legal-notices' },
      { text: 'Expenses', icon: <AccountBalanceWalletIcon />, path: '/admin/expenses' },
      { text: 'Employees', icon: <PeopleIcon />, path: '/admin/employees' },
      { text: 'HR Management', icon: <PeopleIcon />, path: '/admin/hr' },
      { text: 'Payroll', icon: <AccountBalanceIcon />, path: '/admin/payroll' },
      { text: 'Timesheets', icon: <ScheduleIcon />, path: '/admin/timesheets' },
      { text: 'Office Locations', icon: <BusinessIcon />, path: '/admin/office-locations' },
      { text: 'Court Locations', icon: <GavelIcon />, path: '/admin/court-locations' },
      { text: 'Reminders', icon: <AccessAlarmIcon />, path: '/admin/reminders' }
    );
  } else {
    menuItems.push(
      { text: 'Timesheets', icon: <ScheduleIcon />, path: `/${user?.role}/timesheets` },
      { text: 'Reminders', icon: <AccessAlarmIcon />, path: `/${user?.role}/reminders` }
    );
  }

  const isActive = (path) => {
    if (path === `/${user?.role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" fontWeight={700}>
          Legal Office
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'white' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 400,
                  fontSize: '0.9375rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ mx: 1, borderRadius: 2 }}>
            <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ color: 'error.main' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {user?.name}
        </Typography>
        <Chip
          label={user?.role === 'admin' ? 'Admin' : user?.designation || 'Employee'}
          size="small"
          sx={{
            mt: 0.5,
            bgcolor: user?.role === 'admin' ? 'secondary.main' : 'primary.main',
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                whiteSpace: 'nowrap',
              }}
            >
              {format(new Date(), 'EEEE, MMMM dd, yyyy')}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ display: { xs: 'block', sm: 'none' } }}
            >
              {format(new Date(), 'MMM dd')}
            </Typography>
            <Chip
              label={format(new Date(), 'hh:mm a')}
              size="small"
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <IconButton 
              color="inherit" 
              size="small"
              onClick={handleNotificationClick}
              aria-label="notifications"
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon fontSize={isMobile ? 'small' : 'medium'} />
              </Badge>
            </IconButton>
            
            {/* Notifications Menu */}
            <Menu
              anchorEl={notificationAnchor}
              open={Boolean(notificationAnchor)}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 320,
                  maxWidth: { xs: '90vw', sm: 400 },
                  maxHeight: { xs: '70vh', sm: 500 },
                  overflow: 'auto',
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  Notifications
                </Typography>
              </Box>
              {loadingNotifications ? (
                <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading...
                  </Typography>
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No notifications
                  </Typography>
                </Box>
              ) : (
                notifications.map((notification) => (
                  <MenuItem
                    key={notification._id}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification._id);
                      }
                      handleNotificationClose();
                      if (notification.link) {
                        // Prepend role prefix if not already present
                        let link = notification.link;
                        if (!link.startsWith('/admin/') && !link.startsWith('/employee/')) {
                          link = `/${user?.role}${link}`;
                        }
                        navigate(link);
                      }
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                      cursor: 'pointer',
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: notification.isRead ? 400 : 600,
                          mb: 0.5
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(notification.createdAt)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
              <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  color="primary" 
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => {
                    handleNotificationClose();
                    // Navigate to notifications page if you create one, or stay here
                  }}
                >
                  View All Notifications
                </Typography>
              </Box>
            </Menu>

            <IconButton
              onClick={handleProfileClick}
              size="small"
              sx={{ p: 0, ml: { xs: 0.5, sm: 1 } }}
              aria-label="account menu"
            >
              <Avatar sx={{ 
                width: { xs: 28, sm: 32 }, 
                height: { xs: 28, sm: 32 }, 
                bgcolor: 'primary.main',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                cursor: 'pointer',
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            {/* Profile Menu */}
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={handleProfileClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
                <Chip
                  label={user?.role === 'admin' ? 'Admin' : user?.designation || 'Employee'}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: user?.role === 'admin' ? 'secondary.main' : 'primary.main',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              </Box>
              <MenuItem onClick={handleProfileClose}>
                <ListItemIcon>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText primary="My Profile" />
              </MenuItem>
              <MenuItem 
                onClick={() => {
                  handleProfileClose();
                  navigate(`/${user?.role}`);
                }}
              >
                <ListItemIcon>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogoutClick} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { 
            xs: '100%',
            sm: `calc(100% - ${drawerWidth}px)` 
          },
          maxWidth: '100%',
          minHeight: '100vh',
          bgcolor: 'background.default',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
