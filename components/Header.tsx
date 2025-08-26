import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedToolbar } from '@/components/AnimatedToolbar';
import type { Tool } from '@/src/model/types';
import {
    User,
    LogOut,
    Save,
    FolderOpen,
    X,
  } from 'lucide-react';

const Header = ({
    tools,
    activeTool,
    onToolChange,
    isMobile,
    isToolMenuOpen,
    setIsToolMenuOpen,
    triggerFeedback,
    tool,
    toggleFullscreen,
    displayedTools,
    isAuthenticated,
    user,
    signOut,
    setIsProjectsModalOpen,
    setIsAuthModalOpen,
    setDesignMode,
    designMode
}) => {
  return (
<header className="absolute top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between p-4">
        {/* User Account Controls */}
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-3">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{user?.email}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsProjectsModalOpen(true)}
                        size="sm"
                        className="flex-1"
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Projects
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          signOut();
                          triggerFeedback();
                        }}
                        size="sm"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsAuthModalOpen(true)}
                    size="sm"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In / Sign Up
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tool Selection UI */}
        <div className="flex items-center gap-2">
          {isMobile && !isToolMenuOpen ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsToolMenuOpen(true);
                triggerFeedback();
              }}
              className="w-14 h-14 hover:bg-gray-100 active:scale-95"
              aria-label="Select Tool"
            >
              {(() => {
                const Icon = tools.find((t) => t.name === tool)?.icon;
                return Icon ? <Icon className="w-6 h-6" /> : null;
              })()}
            </Button>
          ) : (
            <div
              className={`transition-all duration-700 ${
                isMobile
                  ? isToolMenuOpen
                    ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                    : 'hidden'
                  : ''
              }`}
            >
              <AnimatedToolbar
                tools={displayedTools.map(({ name, icon, label, shortcut, color }) => ({
                  name,
                  icon,
                  label,
                  shortcut,
                  color,
                }))}
                activeTool={tool}
                onToolChange={(selectedTool) => {
                  if (selectedTool === 'fullscreen') {
                    toggleFullscreen();
                    return;
                  }
                  onToolChange(selectedTool as Tool);
                  if (isMobile) setIsToolMenuOpen(false);
                }}
                isMobile={isMobile}
                className={isMobile ? 'max-w-[calc(100vw-2rem)]' : ''}
              />
              {isMobile && (
                <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm mt-2">
                  <CardContent className="p-2">
                    <div className="mb-3 space-y-2">
                      {isAuthenticated ? (
                        <>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="truncate">{user?.email}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsProjectsModalOpen(true);
                                setIsToolMenuOpen(false);
                              }}
                              size="sm"
                              className="flex-1"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Projects
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                signOut();
                                triggerFeedback();
                              }}
                              size="sm"
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAuthModalOpen(true);
                            setIsToolMenuOpen(false);
                          }}
                          className="w-full"
                          size="sm"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Sign In / Sign Up
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDesignMode((prevMode) =>
                          prevMode === 'graph' ? 'residential' : 'graph',
                        );
                        triggerFeedback();
                      }}
                      className="w-full mt-2 text-xs"
                      size="sm"
                    >
                      {designMode === 'graph' ? 'Residential Builder' : 'Graph Paper'}
                    </Button>
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsToolMenuOpen(false);
                          triggerFeedback();
                        }}
                        className="w-8 h-8 hover:bg-gray-100 active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
